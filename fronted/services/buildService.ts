/**
 * 建造服务
 * 处理道路、定居点、城市的建造逻辑
 */

import { GameState, GamePhase, BuildingType, Vertex } from '../types';

export class BuildService {
  /**
   * 检查是否可以在指定边上建造道路
   * 核心规则：
   * 1. 该边上不能已经有道路
   * 2. 必须连接到自己的建筑（定居点或城市）或道路
   * 
   * @param state 游戏状态
   * @param edgeId 边的ID
   * @param playerId 玩家ID
   * @returns 是否可以建造
   */
  static canBuildRoadAt(state: GameState, edgeId: string, playerId: string): boolean {
    const edge = state.map.edges.find(e => e.id === edgeId);
    
    // 边不存在或已有道路
    if (!edge || edge.road) return false;
    
    // 检查边的两个端点是否有自己的建筑
    const hasOwnBuilding = edge.vertexIds.some(vId => 
      state.map.vertices.find(v => v.id === vId)?.building?.ownerId === playerId
    );
    
    // 检查边的两个端点是否连接到自己的道路
    const hasOwnRoad = edge.vertexIds.some(vId => 
      state.map.edges.some(e => 
        e.road?.ownerId === playerId && e.vertexIds.includes(vId)
      )
    );
    
    return hasOwnBuilding || hasOwnRoad;
  }

  /**
   * 建造道路
   * 消耗：1木材 + 1砖块（初始放置阶段免费，道路建设卡免费）
   * 规则：
   * - 必须连接到自己的建筑或道路
   * - 每条边只能有一条道路
   * - 初始放置阶段每个玩家建造2条道路
   * 
   * @param state 游戏状态
   * @param edgeId 边的ID
   * @param playerId 玩家ID
   * @param showToast 显示提示的回调函数
   * @returns 是否建造成功
   */
  static buildRoad(
    state: GameState,
    edgeId: string,
    playerId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    const isSetup = state.phase === GamePhase.SETUP;
    const isRoadBuilding = state.devCardAction?.type === 'ROAD_BUILDING' && state.devCardAction.playerId === playerId;
    
    // 初始放置阶段：检查是否已建造2条道路
    if (isSetup && player.setupRoads >= 2) return false;
    
    // 正常阶段且非道路建设卡：检查资源是否足够
    if (!isSetup && !isRoadBuilding && (player.resources.WOOD < 1 || player.resources.BRICK < 1)) {
      showToast("资源不足，需要 1 木材 + 1 砖块。", "error");
      return false;
    }
    
    // 检查是否可以在此位置建造
    if (this.canBuildRoadAt(state, edgeId, playerId)) {
        const edge = state.map.edges.find(e => e.id === edgeId);
        if (!edge) return false;
        
        // 建造道路
        edge.road = { ownerId: playerId };
        
        // 扣除资源（初始放置阶段和道路建设卡免费）
        if (!isSetup && !isRoadBuilding) {
          player.resources.WOOD--;
          player.resources.BRICK--;
        } else if (isSetup) {
          player.setupRoads++;
        }
        
        // 如果是道路建设卡，更新计数
        if (isRoadBuilding) {
          state.devCardAction!.data.roadsBuilt++;
          state.log.unshift(`🛤️ ${player.name} 使用道路建设卡建造了第 ${state.devCardAction!.data.roadsBuilt} 条免费道路。`);
          
          // 如果已建造2条，清除状态
          if (state.devCardAction!.data.roadsBuilt >= 2) {
            state.devCardAction = undefined;
            state.log.unshift(`✅ ${player.name} 完成了道路建设卡的使用。`);
            showToast("道路建设完成！", "success");
          } else {
            showToast(`已建造1条，还可以建造1条。`, "info");
          }
        }
        
        // TODO: 计算最长道路
        
        return true;
    }
    
    return false;
  }

  /**
   * 检查是否可以在指定顶点建造定居点
   * 核心规则：
   * 1. 该顶点不能已经有建筑
   * 2. 距离规则：相邻顶点（间隔1个路段）不能有任何建筑
   * 3. 初始放置阶段：无需道路连接
   * 4. 正常阶段：必须连接到自己的道路
   * 
   * @param state 游戏状态
   * @param vertexId 顶点ID
   * @param playerId 玩家ID
   * @returns 是否可以建造
   */
  static canBuildSettlementAt(state: GameState, vertexId: string, playerId: string): boolean {
    const vertex = state.map.vertices.find(v => v.id === vertexId);
    
    // 顶点不存在或已有建筑
    if (!vertex || vertex.building) return false;
    
    // 找到所有相邻顶点（通过边连接）
    const neighborVIds = state.map.edges
      .filter(e => e.vertexIds.includes(vertexId))
      .map(e => e.vertexIds.find(id => id !== vertexId)!);
    
    // 检查距离规则：相邻顶点不能有建筑
    if (neighborVIds.some(nid => state.map.vertices.find(v => v.id === nid)?.building)) {
      return false;
    }
    
    // 初始放置阶段：无需道路连接
    if (state.phase === GamePhase.SETUP) return true;
    
    // 正常阶段：必须连接到自己的道路
    return state.map.edges.some(e => 
      e.road?.ownerId === playerId && e.vertexIds.includes(vertexId)
    );
  }

  /**
   * 建造定居点
   * 消耗：1木材 + 1砖块 + 1羊毛 + 1粮食（初始放置阶段免费）
   * 规则：
   * - 必须满足距离规则（相邻顶点无建筑）
   * - 正常阶段必须连接到自己的道路
   * - 每个定居点提供1胜利点
   * 
   * @param state 游戏状态
   * @param vertex 顶点对象
   * @param playerId 玩家ID
   * @param showToast 显示提示的回调函数
   * @returns 是否建造成功
   */
  static buildSettlement(
    state: GameState,
    vertex: Vertex,
    playerId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    const isSetup = state.phase === GamePhase.SETUP;
    
    // 检查资源是否足够（初始放置阶段免费）
    if (!isSetup && (
      player.resources.WOOD < 1 || 
      player.resources.BRICK < 1 || 
      player.resources.SHEEP < 1 || 
      player.resources.WHEAT < 1
    )) {
      showToast("资源不足，需要 1 木材 + 1 砖块 + 1 羊毛 + 1 粮食。", "error");
      return false;
    }
    
    // 扣除资源（初始放置阶段免费）
    if (!isSetup) {
      player.resources.WOOD--;
      player.resources.BRICK--;
      player.resources.SHEEP--;
      player.resources.WHEAT--;
    } else {
      player.setupSettlements++;
    }
    
    // 建造定居点
    vertex.building = { type: BuildingType.SETTLEMENT, ownerId: playerId };
    player.victoryPoints++;
    
    if (!isSetup) {
      state.log.unshift(`你建造了一个定居点！`);
      showToast("建造成功！", "success");
    }
    
    return true;
  }

  /**
   * 升级城市
   * 消耗：3矿石 + 2粮食
   * 规则：
   * - 只能升级自己的定居点
   * - 城市提供2胜利点（定居点1点+升级1点）
   * - 城市产出资源翻倍
   * 
   * @param state 游戏状态
   * @param vertexId 顶点ID
   * @param playerId 玩家ID
   * @param showToast 显示提示的回调函数
   * @returns 是否升级成功
   */
  static upgradeToCity(
    state: GameState,
    vertexId: string,
    playerId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
    const vertex = state.map.vertices.find(v => v.id === vertexId);
    const player = state.players.find(p => p.id === playerId);
    
    if (!vertex || !player || !vertex.building) return false;
    
    // 检查是否是自己的定居点
    if (vertex.building.ownerId !== playerId || vertex.building.type !== BuildingType.SETTLEMENT) {
      return false;
    }
    
    // 检查资源是否足够
    if (player.resources.ORE >= 3 && player.resources.WHEAT >= 2) {
        player.resources.ORE -= 3;
        player.resources.WHEAT -= 2;
        vertex.building.type = BuildingType.CITY;
        player.victoryPoints++;
        state.log.unshift(`你将定居点升级为城市！`);
        showToast("升级成功！", "success");
        return true;
    } else {
        showToast("资源不足，需要 3 矿石 + 2 粮食。", "error");
        return false;
    }
  }
}
