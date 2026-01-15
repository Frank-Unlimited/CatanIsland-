/**
 * 强盗服务
 * 处理强盗移动、资源偷窃、弃牌等逻辑
 */

import { GameState, GamePhase, Player, ResourceType } from '../types';
import { TERRAIN_CONFIG, RESOURCE_NAMES } from '../constants';
import { MapUtils } from '../utils/mapUtils';

export class RobberService {
  /**
   * 处理掷出7点的强盗事件
   * 完整流程（按顺序执行）：
   * 1. 资源弃牌：所有手牌>7张的玩家进入弃牌阶段，自己选择弃掉一半（向下取整）
   * 2. 强盗移动：进入ROBBER_PLACEMENT阶段，等待玩家选择新位置
   * 3. 资源偷窃：如果新位置有相邻玩家，可以偷取1张资源卡
   */
  static handleSevenRoll(state: GameState): void {
    state.log.unshift("⚠️ 掷出 7 点！强盗事件触发。");
    
    // 检查哪些玩家需要弃牌（资源>7张）
    const playersToDiscard = state.players.filter(p => {
      const total = Object.values(p.resources).reduce((a, b) => a + b, 0);
      return total > 7;
    });

    if (playersToDiscard.length > 0) {
      // 进入弃牌阶段
      state.phase = GamePhase.DISCARD_RESOURCES;
      state.discardingPlayers = playersToDiscard.map(p => p.id);
      
      playersToDiscard.forEach(p => {
        const total = Object.values(p.resources).reduce((a, b) => a + b, 0);
        const discardCount = Math.floor(total / 2);
        state.log.unshift(`${p.name} 需要弃掉 ${discardCount} 张资源卡。`);
      });
    } else {
      // 没有玩家需要弃牌，直接进入强盗移动阶段
      state.phase = GamePhase.ROBBER_PLACEMENT;
    }
  }

  /**
   * 玩家选择弃掉指定的资源
   * @param state 游戏状态
   * @param playerId 玩家ID
   * @param discardResources 要弃掉的资源
   * @param showToast 显示提示的回调函数
   * @returns 是否弃牌成功
   */
  static discardResources(
    state: GameState,
    playerId: string,
    discardResources: Partial<Record<ResourceType, number>>,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    if (state.phase !== GamePhase.DISCARD_RESOURCES) return false;
    if (!state.discardingPlayers?.includes(playerId)) return false;

    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    // 计算需要弃掉的数量
    const total = Object.values(player.resources).reduce((a, b) => a + b, 0);
    const requiredDiscard = Math.floor(total / 2);
    
    // 计算实际弃掉的数量
    const actualDiscard = Object.values(discardResources).reduce((a, b) => a + (b || 0), 0);
    
    if (actualDiscard !== requiredDiscard) {
      showToast(`需要弃掉 ${requiredDiscard} 张资源卡`, 'error');
      return false;
    }

    // 检查玩家是否有足够的资源
    for (const [res, count] of Object.entries(discardResources)) {
      if (count && count > 0) {
        if (player.resources[res as ResourceType] < count) {
          showToast(`${RESOURCE_NAMES[res as ResourceType]} 不足`, 'error');
          return false;
        }
      }
    }

    // 弃掉资源
    for (const [res, count] of Object.entries(discardResources)) {
      if (count && count > 0) {
        player.resources[res as ResourceType] -= count;
      }
    }

    // 从弃牌列表中移除该玩家
    state.discardingPlayers = state.discardingPlayers.filter(id => id !== playerId);
    state.log.unshift(`${player.name} 弃掉了 ${actualDiscard} 张资源卡。`);
    showToast('弃牌完成', 'success');

    // 如果所有玩家都完成弃牌，进入强盗移动阶段
    if (state.discardingPlayers.length === 0) {
      state.phase = GamePhase.ROBBER_PLACEMENT;
      state.log.unshift('所有玩家弃牌完成，请移动强盗。');
    }

    return true;
  }

  /**
   * 移动强盗到指定的地形板块
   * 核心规则：
   * 1. 只能在ROBBER_PLACEMENT阶段调用
   * 2. 可以移动到任意地形板块（包括沙漠，但沙漠本就不产资源）
   * 3. 被强盗占据的板块停止产出资源
   * 4. 如果新位置有其他玩家的建筑相邻，进入偷窃阶段
   * 
   * @param state 游戏状态
   * @param hexId 目标地形板块的ID
   * @param showToast 显示提示的回调函数
   * @returns 是否移动成功
   */
  static moveRobber(
    state: GameState,
    hexId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    if (state.phase !== GamePhase.ROBBER_PLACEMENT) return false;
    
    const hex = state.map.hexes.find(h => h.id === hexId);
    if (!hex) return false;
    
    // 检查是否移动到当前位置（不允许）
    if (hex.hasRobber) {
        showToast("强盗必须移动到新的位置。", "error");
        return false;
    }
    
    // 移除所有板块上的强盗标记
    state.map.hexes.forEach(h => h.hasRobber = false);
    
    // 在新位置放置强盗
    hex.hasRobber = true;
    state.log.unshift(`强盗被移动到了 ${TERRAIN_CONFIG[hex.terrain].name}。`);
    
    // 查找该板块相邻的其他玩家（可以偷窃的目标）
    const victims = new Set<string>();
    const hexCenter = MapUtils.hexToPixel(hex.q, hex.r);
    
    state.map.vertices.forEach(v => {
        // 只考虑有建筑且不是当前玩家的顶点
        if (v.building && v.building.ownerId !== state.currentPlayerId) {
            // 检查顶点是否与该六边形相邻
            if (MapUtils.isVertexAdjacentToHex(v, hexCenter)) {
                victims.add(v.building.ownerId);
            }
        }
    });

    // 如果有可偷窃的目标，进入偷窃阶段
    if (victims.size > 0) {
        state.phase = GamePhase.ROBBER_STEAL;
        state.stealingFrom = Array.from(victims);
        state.log.unshift(`选择一个玩家偷取资源。`);
    } else {
        // 没有可偷窃的目标，直接进入主回合
        state.phase = GamePhase.MAIN_TURN;
    }
    
    return true;
  }

  /**
   * 从指定玩家处偷取1张随机资源卡
   * 核心规则：
   * 1. 只能在ROBBER_STEAL阶段调用
   * 2. 只能偷取资源卡，不能偷取发展卡
   * 3. 随机选择受害者的一种资源
   * 4. 偷取完成后进入主回合
   * 
   * @param state 游戏状态
   * @param victimId 被偷窃玩家的ID
   * @param showToast 显示提示的回调函数
   * @returns 是否偷取成功
   */
  static stealFrom(
    state: GameState,
    victimId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      if (state.phase !== GamePhase.ROBBER_STEAL) return false;
      
      const victim = state.players.find(p => p.id === victimId);
      const thief = state.players.find(p => p.id === state.currentPlayerId);
      
      if (!victim || !thief) return false;

      // 获取受害者所有有资源的类型
      const available = (Object.keys(victim.resources) as ResourceType[])
        .filter(r => victim.resources[r] > 0);
      
      if (available.length > 0) {
          // 随机选择一种资源偷取
          const res = available[Math.floor(Math.random() * available.length)];
          victim.resources[res]--;
          thief.resources[res]++;
          state.log.unshift(`${thief.name} 从 ${victim.name} 处偷走了 1 张 ${RESOURCE_NAMES[res]}。`);
          showToast(`偷取了 ${RESOURCE_NAMES[res]}！`, "success");
      } else {
          state.log.unshift(`${victim.name} 没有资源可以偷取。`);
      }
      
      // 偷取完成，进入主回合
      state.phase = GamePhase.MAIN_TURN;
      state.stealingFrom = [];
      return true;
  }
}
