/**
 * 动画服务
 * 管理卡牌获取动画的显示
 */

import { ResourceType, DevCardType } from '../types';

export interface CardGain {
  id: string;
  cardType: 'RESOURCE' | 'DEVELOPMENT';
  card: ResourceType | DevCardType;
  count: number;
  playerName: string; // 玩家名称
  action: 'GAIN' | 'USE'; // 获得 或 使用
}

type AnimationListener = (gains: CardGain[]) => void;

class AnimationService {
  private listeners: AnimationListener[] = [];

  /**
   * 订阅动画事件
   */
  subscribe(listener: AnimationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 显示卡牌动画
   * @param cardType 卡牌类型（资源卡/发展卡）
   * @param card 具体卡牌
   * @param count 数量
   * @param playerName 玩家名称
   * @param action 动作（获得/使用）
   */
  showCardGain(
    cardType: 'RESOURCE' | 'DEVELOPMENT', 
    card: ResourceType | DevCardType, 
    count: number,
    playerName: string,
    action: 'GAIN' | 'USE'
  ): void {
    const gain: CardGain = {
      id: `${cardType}-${card}-${Date.now()}-${Math.random()}`,
      cardType,
      card,
      count,
      playerName,
      action
    };
    
    this.listeners.forEach(listener => listener([gain]));
  }

  /**
   * 显示多张卡牌动画
   */
  showMultipleCardGains(
    gains: Array<{ 
      cardType: 'RESOURCE' | 'DEVELOPMENT', 
      card: ResourceType | DevCardType, 
      count: number,
      playerName: string,
      action: 'GAIN' | 'USE'
    }>
  ): void {
    const cardGains: CardGain[] = gains.map(g => ({
      id: `${g.cardType}-${g.card}-${Date.now()}-${Math.random()}`,
      cardType: g.cardType,
      card: g.card,
      count: g.count,
      playerName: g.playerName,
      action: g.action
    }));
    
    this.listeners.forEach(listener => listener(cardGains));
  }
}

export const animationService = new AnimationService();
