/**
 * 网络服务
 * 处理与后端服务器的 WebSocket 通信
 * 
 * 职责：
 * - 建立和维护 WebSocket 连接
 * - 同步游戏状态到服务器
 * - 接收服务器推送的游戏状态
 * - 处理断线重连
 * 
 * 注意：游戏逻辑在客户端执行，服务器只做状态同步和流程控制
 */

import { GameState } from '../types';

// 消息类型枚举
export enum MessageType {
  // 客户端 -> 服务器
  JOIN_GAME = 'JOIN_GAME',
  UPDATE_STATE = 'UPDATE_STATE',  // 同步游戏状态
  
  // 服务器 -> 客户端
  PLAYER_ID = 'PLAYER_ID',
  GAME_STATE = 'GAME_STATE',
  ERROR = 'ERROR',
  NOTIFICATION = 'NOTIFICATION'
}

// WebSocket 消息接口
interface WSMessage {
  type: MessageType;
  payload?: any;
}

// 回调函数类型
type StateCallback = (state: GameState) => void;
type NotificationCallback = (message: string, type: 'success' | 'error' | 'info') => void;
type ConnectionCallback = (connected: boolean) => void;

/**
 * 网络服务类
 * 单例模式，全局唯一实例
 */
export class NetworkService {
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private playerId: string | null = null;
  private gameId: string | null = null;
  
  // 回调函数列表
  private stateCallbacks: StateCallback[] = [];
  private notificationCallbacks: NotificationCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  
  // 重连配置
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * 连接到服务器
   * @param url WebSocket 服务器地址
   * @param playerName 玩家名称
   * @param gameId 游戏ID（可选，不提供则创建新游戏）
   */
  connect(url: string, playerName: string, gameId?: string): void {
    this.serverUrl = url;
    this.gameId = gameId || null;

    console.log(`[NetworkService] 连接到服务器: ${url}`);
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[NetworkService] WebSocket 连接已建立');
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
      
      // 发送加入游戏请求
      this.send(MessageType.JOIN_GAME, {
        gameId: this.gameId,
        playerId: this.playerId, // 重连时使用之前的 playerId
        playerName
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[NetworkService] 消息解析错误:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[NetworkService] WebSocket 连接已关闭');
      this.notifyConnectionCallbacks(false);
      this.attemptReconnect(playerName);
    };

    this.ws.onerror = (error) => {
      console.error('[NetworkService] WebSocket 错误:', error);
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('[NetworkService] 已断开连接');
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(playerName: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[NetworkService] 重连失败，已达到最大尝试次数');
      this.notifyNotificationCallbacks('连接失败，请刷新页面重试', 'error');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[NetworkService] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.serverUrl, playerName, this.gameId || undefined);
    }, this.reconnectDelay);
  }

  /**
   * 处理服务器消息
   */
  private handleMessage(message: WSMessage): void {
    const { type, payload } = message;

    switch (type) {
      case MessageType.PLAYER_ID:
        // 保存玩家ID和游戏ID，用于重连
        this.playerId = payload.playerId;
        this.gameId = payload.gameId;
        console.log(`[NetworkService] 收到玩家ID: ${this.playerId}, 游戏ID: ${this.gameId}`);
        break;

      case MessageType.GAME_STATE:
        // 广播游戏状态更新
        this.notifyStateCallbacks(payload);
        break;

      case MessageType.NOTIFICATION:
        // 显示通知消息
        this.notifyNotificationCallbacks(payload.message, payload.type);
        break;

      case MessageType.ERROR:
        // 显示错误消息
        this.notifyNotificationCallbacks(payload.message, 'error');
        break;

      default:
        console.warn(`[NetworkService] 未知消息类型: ${type}`);
    }
  }

  /**
   * 发送消息到服务器
   */
  private send(type: MessageType, payload?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[NetworkService] WebSocket 未连接');
      this.notifyNotificationCallbacks('网络连接已断开', 'error');
      return;
    }

    const message: WSMessage = { type, payload };
    this.ws.send(JSON.stringify(message));
  }

  // ==================== 游戏操作方法 ====================

  /**
   * 同步游戏状态到服务器
   */
  updateState(state: any): void {
    this.send(MessageType.UPDATE_STATE, { state });
  }

  // ==================== 回调管理 ====================

  /**
   * 订阅游戏状态更新
   */
  onStateUpdate(callback: StateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 订阅通知消息
   */
  onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 订阅连接状态变化
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有状态回调
   */
  private notifyStateCallbacks(state: GameState): void {
    this.stateCallbacks.forEach(callback => callback(state));
  }

  /**
   * 通知所有通知回调
   */
  private notifyNotificationCallbacks(message: string, type: 'success' | 'error' | 'info'): void {
    this.notificationCallbacks.forEach(callback => callback(message, type));
  }

  /**
   * 通知所有连接状态回调
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // ==================== 工具方法 ====================

  /**
   * 获取当前玩家ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * 获取当前游戏ID
   */
  getGameId(): string | null {
    return this.gameId;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 导出单例实例
export const networkService = new NetworkService();
