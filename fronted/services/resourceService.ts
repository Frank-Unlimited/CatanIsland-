/**
 * 资源服务
 * 处理资源分配、初始资源等
 */

import { GameState, BuildingType, ResourceType } from '../types';
import { TERRAIN_CONFIG, RESOURCE_NAMES } from '../constants';
import { MapUtils } from '../utils/mapUtils';
import { animationService } from './animationService';
import { gameService } from './gameService';

export class ResourceService {
  /**
   * 根据骰子点数分配资源
   * 核心规则：
   * 1. 找到所有数字圆片等于骰子点数的地形板块
   * 2. 被强盗占据的板块不产出资源
   * 3. 相邻的定居点获得1份资源，城市获得2份资源
   * 
   * @param state 游戏状态
   * @param roll 骰子点数
   */
  static distributeResources(state: GameState, roll: number): void {
    // 初始化资源获取记录
    const resourceGains: Record<string, Record<ResourceType, number>> = {};
    
    // 找到所有符合条件的地形板块（数字匹配且没有强盗）
    state.map.hexes
      .filter(h => h.numberToken === roll && !h.hasRobber)
      .forEach(hex => {
        // 获取该地形产出的资源类型
        const res = TERRAIN_CONFIG[hex.terrain]?.resource;
        if (!res) return; // 沙漠不产出资源
        
        // 计算六边形中心的像素坐标
        const hexCenter = MapUtils.hexToPixel(hex.q, hex.r);
        
        // 检查所有顶点，找到相邻的建筑
        state.map.vertices.forEach(v => {
          if (!v.building) return;
          
          // 判断顶点是否与该六边形相邻
          if (MapUtils.isVertexAdjacentToHex(v, hexCenter)) {
            const p = state.players.find(pl => pl.id === v.building!.ownerId);
            if (p) {
                // 定居点获得1份资源，城市获得2份资源
                const count = (v.building.type === BuildingType.CITY ? 2 : 1);
                p.resources[res] += count;
                
                // 记录资源获取
                if (!resourceGains[p.id]) {
                  resourceGains[p.id] = {
                    WOOD: 0,
                    BRICK: 0,
                    SHEEP: 0,
                    WHEAT: 0,
                    ORE: 0,
                    DESERT: 0
                  };
                }
                resourceGains[p.id][res] += count;
                
                // 只记录玩家自己的资源获取
                if (p.id === 'p1') {
                  state.log.unshift(`生产：获得了 ${count} 个 ${RESOURCE_NAMES[res]}`);
                }
            }
          }
        });
      });
    
    // 触发动画（只为当前玩家）
    const myPlayerId = gameService.getPlayerId();
    const myPlayer = state.players.find(p => p.id === myPlayerId);
    
    if (myPlayer && resourceGains[myPlayerId]) {
      const myGains = resourceGains[myPlayerId];
      const gains = Object.entries(myGains)
        .filter(([_, count]) => count > 0)
        .map(([resource, count]) => ({
          cardType: 'RESOURCE' as const,
          card: resource as ResourceType,
          count,
          playerName: myPlayer.name,
          action: 'GAIN' as const
        }));
      
      if (gains.length > 0) {
        animationService.showMultipleCardGains(gains);
      }
    }
  }

  /**
   * 为玩家分配初始资源
   * 规则：第二个定居点相邻的地形板块各产出1份资源
   * 这是游戏开始时的资源补偿机制
   * 
   * @param state 游戏状态
   */
  static grantStartingResources(state: GameState): void {
    state.players.forEach(player => {
        // 找到玩家的所有定居点
        const playerSettlements = state.map.vertices.filter(v => v.building?.ownerId === player.id);
        
        // 第二个定居点（索引1）相邻的地形产出资源
        const secondSettlement = playerSettlements[1]; 
        if (secondSettlement) {
            state.map.hexes.forEach(hex => {
                const res = TERRAIN_CONFIG[hex.terrain]?.resource;
                if (!res) return; // 沙漠不产出资源
                
                const hexCenter = MapUtils.hexToPixel(hex.q, hex.r);
                
                // 检查定居点是否与该六边形相邻
                if (MapUtils.isVertexAdjacentToHex(secondSettlement, hexCenter)) {
                    player.resources[res] += 1;
                }
            });
        }
    });
  }

  /**
   * 设置玩家资源（调试模式）
   * 
   * @param state 游戏状态
   * @param playerId 玩家ID
   * @param resource 资源类型
   * @param amount 数量
   */
  static setPlayerResource(
    state: GameState,
    playerId: string,
    resource: ResourceType,
    amount: number
  ): void {
    if (!state.debugMode) return;
    
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.resources[resource] = Math.max(0, amount);
    }
  }
}
