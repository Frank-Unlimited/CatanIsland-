/**
 * 游戏服务相关的类型定义
 */

import { GameState } from '../types';

// 游戏状态监听器
export type GameListener = (state: GameState) => void;

// 通知监听器
export type NotificationListener = (message: string, type: 'success' | 'error' | 'info') => void;
