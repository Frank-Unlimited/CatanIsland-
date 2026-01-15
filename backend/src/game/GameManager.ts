/**
 * 游戏管理器
 * 管理所有游戏房间，只负责状态同步和流程控制
 * 游戏逻辑由客户端处理
 */

import { v4 as uuidv4 } from 'uuid';
import { GameRoom, GameState, Player, GamePhase, ResourceType } from '../types';
import { generateMap } from '../utils/mapGenerator';

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();

  /**
   * 获取或创建游戏房间
   * 如果有等待中的房间，加入该房间；否则创建新房间
   */
  getOrCreateGame(): string {
    // 查找等待中的房间（玩家数 < 4 且处于 MAP_BUILDING 或 SETUP 阶段）
    for (const [gameId, room] of this.rooms.entries()) {
      if (room.state.players.length < 4 && 
          (room.state.phase === GamePhase.MAP_BUILDING || room.state.phase === GamePhase.SETUP)) {
        console.log(`[GameManager] 找到等待中的房间: ${gameId}`);
        return gameId;
      }
    }
    
    // 没有等待中的房间，创建新房间
    return this.createGame();
  }

  /**
   * 创建新游戏房间
   */
  createGame(): string {
    const gameId = uuidv4();
    const terrainSeed = `terrain-${Date.now()}`;
    const tokenSeed = `token-${Date.now()}`;
    const portCount = 9; // 默认9个港口
    
    const mapData = generateMap(terrainSeed, tokenSeed, portCount);
    
    const state: GameState = {
      gameId,
      terrainSeed,
      tokenSeed,
      portCount,
      players: [],
      currentPlayerId: '',
      phase: GamePhase.MAP_BUILDING, // 从地图构建阶段开始
      map: mapData,
      dice: [0, 0],
      log: ['游戏已创建，等待玩家加入...'],
      debugMode: false,
      stealingFrom: [],
      hasRolledDice: false
    };

    const room: GameRoom = {
      gameId,
      state,
      clients: new Map()
    };

    this.rooms.set(gameId, room);
    console.log(`[GameManager] 创建游戏房间: ${gameId}`);
    return gameId;
  }

  /**
   * 玩家加入游戏
   */
  joinGame(gameId: string, playerId: string, playerName: string, ws: any): boolean {
    const room = this.rooms.get(gameId);
    if (!room) return false;

    // 检查玩家是否已在游戏中
    if (room.state.players.find(p => p.id === playerId)) {
      room.clients.set(playerId, ws);
      console.log(`[GameManager] 玩家重新连接: ${playerName} (${playerId})`);
      return true;
    }

    // 限制最多4个玩家
    if (room.state.players.length >= 4) {
      return false;
    }

    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
    const color = colors[room.state.players.length];

    const player: Player = {
      id: playerId,
      name: playerName,
      color,
      resources: {
        WOOD: 0,
        BRICK: 0,
        SHEEP: 0,
        WHEAT: 0,
        ORE: 0,
        DESERT: 0
      },
      victoryPoints: 0,
      roadLength: 0,
      armySize: 0,
      setupSettlements: 0,
      setupRoads: 0,
      setupLocked: false,
      developmentCards: [],
      hasPlayedDevCard: false,
      hiddenVictoryPoints: 0
    };

    room.state.players.push(player);
    room.clients.set(playerId, ws);

    // 第一个玩家成为当前玩家
    if (room.state.players.length === 1) {
      room.state.currentPlayerId = playerId;
    }

    room.state.log.unshift(`${playerName} 加入了游戏`);
    console.log(`[GameManager] 玩家加入: ${playerName} (${playerId})`);
    
    return true;
  }

  /**
   * 玩家离开游戏
   */
  leaveGame(gameId: string, playerId: string): void {
    const room = this.rooms.get(gameId);
    if (!room) return;

    room.clients.delete(playerId);
    console.log(`[GameManager] 玩家断开连接: ${playerId}`);

    // 如果房间为空，删除房间
    if (room.clients.size === 0) {
      this.rooms.delete(gameId);
      console.log(`[GameManager] 删除空房间: ${gameId}`);
    }
  }

  /**
   * 获取游戏房间
   */
  getRoom(gameId: string): GameRoom | undefined {
    return this.rooms.get(gameId);
  }

  /**
   * 广播游戏状态给房间内所有玩家
   */
  broadcastState(gameId: string): void {
    const room = this.rooms.get(gameId);
    if (!room) return;

    const message = JSON.stringify({
      type: 'GAME_STATE',
      payload: room.state
    });

    room.clients.forEach((ws, playerId) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    });
  }

  /**
   * 发送错误消息给指定玩家
   */
  sendError(gameId: string, playerId: string, message: string): void {
    const room = this.rooms.get(gameId);
    if (!room) return;

    const ws = room.clients.get(playerId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message }
      }));
    }
  }

  /**
   * 发送通知消息给指定玩家
   */
  sendNotification(gameId: string, playerId: string, message: string, type: 'success' | 'error' | 'info'): void {
    const room = this.rooms.get(gameId);
    if (!room) return;

    const ws = room.clients.get(playerId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'NOTIFICATION',
        payload: { message, type }
      }));
    }
  }

  /**
   * 更新游戏状态（从客户端接收）
   * 服务器只做基本验证和流程控制
   */
  updateState(gameId: string, playerId: string, newState: Partial<GameState>): boolean {
    const room = this.rooms.get(gameId);
    if (!room) return false;

    // 只在需要验证当前玩家的操作时才检查
    // 地图刷新、游戏设置等操作不需要验证当前玩家
    const needsPlayerCheck = newState.currentPlayerId !== undefined && 
                            newState.currentPlayerId !== room.state.currentPlayerId;
    
    if (needsPlayerCheck && room.state.currentPlayerId !== playerId) {
      console.log(`[GameManager] 非当前玩家尝试切换回合: ${playerId}`);
      return false;
    }

    // 完全替换状态（客户端发送的是完整状态）
    const oldPhase = room.state.phase;
    
    // 保留 gameId 和 clients
    const gameIdToKeep = room.state.gameId;
    room.state = newState as GameState;
    room.state.gameId = gameIdToKeep;

    // 记录状态变化到游戏日志
    if (newState.map && newState.terrainSeed) {
      console.log(`[GameManager] 地图已刷新 by ${playerId}`);
    }
    if (newState.phase && newState.phase !== oldPhase) {
      console.log(`[GameManager] 游戏阶段变化: ${oldPhase} -> ${newState.phase}`);
    }

    // 检查游戏流程控制
    this.checkGameProgress(gameId);

    return true;
  }

  /**
   * 检查游戏进度
   * 服务器负责的流程控制：
   * 1. 所有玩家完成初始放置 -> 分配初始资源并开始游戏
   * 2. 有玩家达到10分 -> 游戏结束
   */
  private checkGameProgress(gameId: string): void {
    const room = this.rooms.get(gameId);
    if (!room) return;

    const state = room.state;

    // 检查初始放置阶段是否完成
    if (state.phase === GamePhase.SETUP) {
      const allPlayersLocked = state.players.every(p => p.setupLocked);

      if (allPlayersLocked && state.players.length > 0) {
        console.log(`[GameManager] 所有玩家锁定初始放置，分配初始资源`);
        
        // 分配初始资源：第二个定居点相邻的地形产出资源
        this.grantStartingResources(state);
        
        state.phase = GamePhase.ROLL_DICE;
        state.log.unshift('✅ 初始放置完成！所有玩家已获得初始资源，游戏正式开始！');
      }
    }

    // 检查胜利条件
    if (state.phase !== GamePhase.GAME_OVER) {
      const winner = state.players.find(p => p.victoryPoints >= 10);
      if (winner) {
        console.log(`[GameManager] 玩家 ${winner.name} 获胜！`);
        state.phase = GamePhase.GAME_OVER;
        state.log.unshift(`🏆 ${winner.name} 获得了胜利！`);
      }
    }
  }

  /**
   * 为玩家分配初始资源
   * 规则：第二个定居点相邻的地形板块各产出1份资源
   */
  private grantStartingResources(state: GameState): void {
    const HEX_SIZE = 60;
    
    const TERRAIN_RESOURCES: any = {
      FOREST: 'WOOD',
      HILLS: 'BRICK',
      PASTURE: 'SHEEP',
      FIELDS: 'WHEAT',
      MOUNTAINS: 'ORE'
    };

    const hexToPixel = (q: number, r: number) => {
      const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
      const y = HEX_SIZE * ((3 / 2) * r);
      return { x, y };
    };

    const distance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };

    state.players.forEach(player => {
      // 找到玩家的所有定居点
      const playerSettlements = state.map.vertices.filter(v => v.building?.ownerId === player.id);
      
      // 第二个定居点（索引1）相邻的地形产出资源
      const secondSettlement = playerSettlements[1];
      if (secondSettlement) {
        state.map.hexes.forEach(hex => {
          const res = TERRAIN_RESOURCES[hex.terrain];
          if (!res) return; // 沙漠不产出资源
          
          const hexCenter = hexToPixel(hex.q, hex.r);
          
          // 检查定居点是否与该六边形相邻
          if (Math.abs(distance(secondSettlement.x, secondSettlement.y, hexCenter.x, hexCenter.y) - HEX_SIZE) < 5) {
            player.resources[res] += 1;
          }
        });
      }
    });
  }

  /**
   * 获取所有游戏房间列表
   */
  listGames(): Array<{ gameId: string; playerCount: number; phase: GamePhase }> {
    return Array.from(this.rooms.values()).map(room => ({
      gameId: room.gameId,
      playerCount: room.state.players.length,
      phase: room.state.phase
    }));
  }
}
