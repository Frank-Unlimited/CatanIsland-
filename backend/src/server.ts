/**
 * WebSocket 服务器
 * 只负责状态同步和流程控制，游戏逻辑由客户端处理
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GameManager } from './game/GameManager';
import { MessageType, WSMessage } from './types';

const PORT = 8080;
const gameManager = new GameManager();

// 创建 HTTP 服务器
const httpServer = createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API 路由
  if (req.url === '/api/rooms' && req.method === 'GET') {
    const rooms = gameManager.listGames().map(room => {
      const fullRoom = gameManager.getRoom(room.gameId);
      return {
        gameId: room.gameId,
        phase: room.phase,
        playerCount: room.playerCount,
        players: fullRoom?.state.players.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          victoryPoints: p.victoryPoints
        })) || []
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms }));
    return;
  }

  // 管理页面
  if (req.url === '/admin' || req.url === '/') {
    try {
      const html = readFileSync(join(__dirname, '../public/admin.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      res.writeHead(404);
      res.end('Admin page not found');
    }
    return;
  }

  // 移动端页面
  if (req.url === '/mobile' || req.url === '/m') {
    try {
      const html = readFileSync(join(__dirname, '../public/mobile.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      res.writeHead(404);
      res.end('Mobile page not found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ server: httpServer });

httpServer.listen(PORT, () => {
  console.log(`🎮 Catan Server 启动在端口 ${PORT}`);
  console.log(`📊 管理面板: http://localhost:${PORT}/admin`);
  console.log(`📱 移动端: http://localhost:${PORT}/mobile`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// 存储客户端信息
const clients = new Map<WebSocket, { playerId: string; gameId: string }>();

wss.on('connection', (ws: WebSocket) => {
  console.log('📡 新客户端连接');

  ws.on('message', (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (error) {
      console.error('❌ 消息解析错误:', error);
      ws.send(JSON.stringify({
        type: MessageType.ERROR,
        payload: { message: '无效的消息格式' }
      }));
    }
  });

  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      gameManager.leaveGame(clientInfo.gameId, clientInfo.playerId);
      clients.delete(ws);
      console.log(`📴 客户端断开: ${clientInfo.playerId}`);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 错误:', error);
  });
});

/**
 * 处理客户端消息
 */
function handleMessage(ws: WebSocket, message: WSMessage) {
  const { type, payload } = message;

  switch (type) {
    case MessageType.JOIN_GAME:
      handleJoinGame(ws, payload);
      break;

    case MessageType.UPDATE_STATE:
      handleUpdateState(ws, payload);
      break;

    default:
      console.log(`⚠️ 未知消息类型: ${type}`);
  }
}

/**
 * 处理加入游戏
 */
function handleJoinGame(ws: WebSocket, payload: any) {
  const { gameId, playerId, playerName } = payload;
  
  let targetGameId = gameId;
  
  // 如果没有指定游戏ID，自动加入或创建游戏
  if (!targetGameId) {
    targetGameId = gameManager.getOrCreateGame();
  }

  const finalPlayerId = playerId || uuidv4();
  const success = gameManager.joinGame(targetGameId, finalPlayerId, playerName, ws);

  if (success) {
    clients.set(ws, { playerId: finalPlayerId, gameId: targetGameId });
    
    // 发送玩家ID给客户端
    ws.send(JSON.stringify({
      type: 'PLAYER_ID',
      payload: { playerId: finalPlayerId, gameId: targetGameId }
    }));

    // 广播游戏状态
    gameManager.broadcastState(targetGameId);
    console.log(`✅ 玩家加入成功: ${playerName} -> 游戏 ${targetGameId}`);
  } else {
    ws.send(JSON.stringify({
      type: MessageType.ERROR,
      payload: { message: '加入游戏失败' }
    }));
  }
}

/**
 * 处理状态更新
 * 客户端发送更新后的游戏状态，服务器验证并广播
 */
function handleUpdateState(ws: WebSocket, payload: any) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;

  const { state } = payload;
  
  const success = gameManager.updateState(clientInfo.gameId, clientInfo.playerId, state);

  if (success) {
    // 广播更新后的状态给所有玩家
    gameManager.broadcastState(clientInfo.gameId);
    console.log(`✅ 状态更新成功: ${clientInfo.playerId}`);
  } else {
    gameManager.sendError(clientInfo.gameId, clientInfo.playerId, '状态更新失败');
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 服务器关闭中...');
  httpServer.close(() => {
    wss.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
});
