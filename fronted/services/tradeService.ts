/**
 * 交易服务
 * 处理玩家间交易、银行交易、港口交易等
 */

import { GameState, ResourceType } from '../types';
import { RESOURCE_NAMES } from '../constants';

export class TradeService {
  /**
   * 获取玩家的交易汇率
   * 基础汇率：4:1（4张同类资源换1张任意资源）
   * 港口加成：
   * - 3:1通用港口：所有资源都是3:1
   * - 2:1特殊资源港口：特定资源是2:1
   * 
   * @param state 游戏状态
   * @param playerId 玩家ID
   * @returns 每种资源的交易汇率
   */
  static getTradeRates(state: GameState, playerId: string): Record<ResourceType, number> {
    // 默认汇率：4:1
    const rates: Record<ResourceType, number> = {
      [ResourceType.WOOD]: 4,
      [ResourceType.BRICK]: 4,
      [ResourceType.SHEEP]: 4,
      [ResourceType.WHEAT]: 4,
      [ResourceType.ORE]: 4,
      [ResourceType.DESERT]: 4
    };
    
    // 查找玩家占领的所有建筑
    const playerBuildings = state.map.vertices.filter(v => v.building?.ownerId === playerId);
    
    // 检查每个建筑是否在港口上
    playerBuildings.forEach(vertex => {
      if (vertex.portId) {
        const port = state.map.ports.find(p => p.id === vertex.portId)!;
        
        if (port.type === 'ANY') {
          // 3:1通用港口：所有资源汇率降至3:1（如果当前汇率更高）
          Object.keys(rates).forEach(res => {
            if (rates[res as ResourceType] > 3) {
              rates[res as ResourceType] = 3;
            }
          });
        } else {
          // 2:1特殊资源港口：特定资源汇率降至2:1
          rates[port.type] = 2;
        }
      }
    });
    
    return rates;
  }

  /**
   * 与银行交易
   * 规则：任意4张资源换1张任意资源（无港口时）
   * 港口加成：3:1通用港口或2:1特殊资源港口
   * 
   * @param state 游戏状态
   * @param playerId 玩家ID
   * @param giveResources 给出的资源（可以是多种资源的组合）
   * @param get 获得的资源类型
   * @param showToast 显示提示的回调函数
   * @returns 是否交易成功
   */
  static tradeWithBank(
    state: GameState,
    playerId: string,
    giveResources: Partial<Record<ResourceType, number>>,
    get: ResourceType,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    // 计算给出的资源总数
    let totalGive = 0;
    for (const res in giveResources) {
      totalGive += giveResources[res as ResourceType] || 0;
    }

    // 检查是否满足4:1的比例
    if (totalGive < 4) {
      showToast("至少需要4个资源才能交易", "error");
      return false;
    }

    // 检查资源是否足够
    for (const res in giveResources) {
      const amount = giveResources[res as ResourceType] || 0;
      if (player.resources[res as ResourceType] < amount) {
        showToast(`${RESOURCE_NAMES[res as ResourceType]} 不足`, "error");
        return false;
      }
    }

    // 计算可以换多少个资源（4个换1个）
    const getAmount = Math.floor(totalGive / 4);

    // 扣除资源
    for (const res in giveResources) {
      const amount = giveResources[res as ResourceType] || 0;
      player.resources[res as ResourceType] -= amount;
    }

    // 增加资源
    player.resources[get] += getAmount;

    const giveDesc = Object.entries(giveResources)
      .filter(([_, amount]) => amount > 0)
      .map(([res, amount]) => `${amount} ${RESOURCE_NAMES[res as ResourceType]}`)
      .join(' + ');

    state.log.unshift(`🏦 银行交易：${giveDesc} ➜ ${getAmount} ${RESOURCE_NAMES[get]}`);
    showToast("交易成功！", "success");
    return true;
  }

  /**
   * 发起玩家间交易提案
   */
  static proposePlayerTrade(
    state: GameState,
    fromPlayerId: string,
    toPlayerId: string,
    offer: Partial<Record<ResourceType, number>>,
    request: Partial<Record<ResourceType, number>>,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    const fromPlayer = state.players.find(p => p.id === fromPlayerId);
    const toPlayer = state.players.find(p => p.id === toPlayerId);
    
    if (!fromPlayer || !toPlayer) return false;

    // 检查自己是否有足够的资源提供
    for (const res in offer) {
      if (fromPlayer.resources[res as ResourceType] < (offer[res as ResourceType] || 0)) {
        showToast(`你没有足够的 ${RESOURCE_NAMES[res as ResourceType]}`, "error");
        return false;
      }
    }

    // 创建交易提案
    state.tradeOffer = {
      fromPlayerId,
      toPlayerId,
      offer,
      request
    };

    const offerDesc = Object.entries(offer)
      .filter(([_, amount]) => amount > 0)
      .map(([res, amount]) => `${amount} ${RESOURCE_NAMES[res as ResourceType]}`)
      .join(' + ');

    const requestDesc = Object.entries(request)
      .filter(([_, amount]) => amount > 0)
      .map(([res, amount]) => `${amount} ${RESOURCE_NAMES[res as ResourceType]}`)
      .join(' + ');

    state.log.unshift(`💼 ${fromPlayer.name} 向 ${toPlayer.name} 发起交易：${offerDesc} ⇄ ${requestDesc}`);
    showToast(`交易提案已发送给 ${toPlayer.name}`, "info");
    return true;
  }

  /**
   * 接受玩家间交易
   */
  static acceptPlayerTrade(
    state: GameState,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    if (!state.tradeOffer) {
      showToast("没有待处理的交易提案", "error");
      return false;
    }

    const { fromPlayerId, toPlayerId, offer, request } = state.tradeOffer;
    const fromPlayer = state.players.find(p => p.id === fromPlayerId);
    const toPlayer = state.players.find(p => p.id === toPlayerId);
    
    if (!fromPlayer || !toPlayer) return false;

    // 再次检查双方资源是否足够
    for (const res in offer) {
      if (fromPlayer.resources[res as ResourceType] < (offer[res as ResourceType] || 0)) {
        showToast(`${fromPlayer.name} 的 ${RESOURCE_NAMES[res as ResourceType]} 不足`, "error");
        state.tradeOffer = undefined;
        return false;
      }
    }

    for (const res in request) {
      if (toPlayer.resources[res as ResourceType] < (request[res as ResourceType] || 0)) {
        showToast(`你的 ${RESOURCE_NAMES[res as ResourceType]} 不足`, "error");
        state.tradeOffer = undefined;
        return false;
      }
    }

    // 执行交易
    for (const res in offer) {
      const amount = offer[res as ResourceType] || 0;
      fromPlayer.resources[res as ResourceType] -= amount;
      toPlayer.resources[res as ResourceType] += amount;
    }

    for (const res in request) {
      const amount = request[res as ResourceType] || 0;
      toPlayer.resources[res as ResourceType] -= amount;
      fromPlayer.resources[res as ResourceType] += amount;
    }

    state.log.unshift(`✅ ${toPlayer.name} 接受了 ${fromPlayer.name} 的交易`);
    showToast("交易成功！", "success");
    state.tradeOffer = undefined;
    return true;
  }

  /**
   * 拒绝玩家间交易
   */
  static rejectPlayerTrade(
    state: GameState,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    if (!state.tradeOffer) return false;

    const fromPlayer = state.players.find(p => p.id === state.tradeOffer!.fromPlayerId);
    const toPlayer = state.players.find(p => p.id === state.tradeOffer!.toPlayerId);

    if (fromPlayer && toPlayer) {
      state.log.unshift(`❌ ${toPlayer.name} 拒绝了 ${fromPlayer.name} 的交易`);
    }

    state.tradeOffer = undefined;
    showToast("已拒绝交易", "info");
    return true;
  }

  /**
   * 取消交易提案
   */
  static cancelPlayerTrade(
    state: GameState,
    playerId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    if (!state.tradeOffer || state.tradeOffer.fromPlayerId !== playerId) {
      return false;
    }

    state.tradeOffer = undefined;
    showToast("已取消交易提案", "info");
    return true;
  }

  /**
   * 玩家间交易（旧方法，保留兼容性）
   */
  static tradeWithPlayer(
    state: GameState,
    currentPlayerId: string,
    targetId: string,
    offer: Partial<Record<ResourceType, number>>,
    request: Partial<Record<ResourceType, number>>,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    // 直接执行交易（不需要对方确认）
    const player = state.players.find(p => p.id === currentPlayerId);
    const target = state.players.find(p => p.id === targetId);
    
    if (!player || !target) return false;

    // 检查自己是否有足够的资源提供
    for (const res in offer) {
        if (player.resources[res as ResourceType] < (offer[res as ResourceType] || 0)) {
            showToast(`你没有足够的 ${RESOURCE_NAMES[res as ResourceType]}。`, "error");
            return false;
        }
    }
    
    // 检查对方是否有足够的资源
    for (const res in request) {
        if (target.resources[res as ResourceType] < (request[res as ResourceType] || 0)) {
            showToast(`对方没有足够的 ${RESOURCE_NAMES[res as ResourceType]}。`, "error");
            return false;
        }
    }

    // 执行交易：扣除自己的资源，增加对方的资源
    for (const res in offer) {
        const amount = offer[res as ResourceType] || 0;
        player.resources[res as ResourceType] -= amount;
        target.resources[res as ResourceType] += amount;
    }
    
    // 执行交易：扣除对方的资源，增加自己的资源
    for (const res in request) {
        const amount = request[res as ResourceType] || 0;
        target.resources[res as ResourceType] -= amount;
        player.resources[res as ResourceType] += amount;
    }

    state.log.unshift(`玩家交易成功：与 ${target.name} 完成了交换。`);
    showToast("交易成功！", "success");
    return true;
  }
}
