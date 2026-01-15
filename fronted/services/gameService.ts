/**
 * 游戏服务主文件（客户端逻辑版本）
 * 所有游戏逻辑在客户端执行，然后同步到服务器
 * 
 * 职责：
 * [CLIENT] - 执行所有游戏逻辑
 * [CLIENT] - 管理本地游戏状态
 * [NETWORK] - 同步状态到服务器
 */

import { BuildingType, GamePhase, GameState, ResourceType, Vertex } from '../types';
import { GameListener, NotificationListener } from './types';
import { TradeService } from './tradeService';
import { RobberService } from './robberService';
import { BuildService } from './buildService';
import { DevelopmentCardService } from './developmentCardService';
import { ResourceService } from './resourceService';
import { networkService } from './networkService';
import { generateMap } from '../utils/mapGenerator';

class GameService {
  // [CLIENT] 客户端状态
  private state: GameState | null = null;
  private listeners: GameListener[] = [];
  private notificationListeners: NotificationListener[] = [];
  
  // [CLIENT] 当前客户端的玩家ID
  private playerId: string | null = null;
  
  // [CLIENT] 连接状态
  private connected: boolean = false;

  constructor() {
    // 等待连接服务器
  }

  /**
   * [CLIENT] 连接到服务器
   * @param url WebSocket 服务器地址
   * @param playerName 玩家名称
   * @param gameId 游戏ID（可选）
   */
  public connect(url: string, playerName: string = '玩家', gameId?: string) {
    console.log(`[GameService] 连接到服务器: ${url}`);
    
    // 订阅网络服务的回调
    networkService.onStateUpdate((newState) => {
      this.state = newState;
      this.playerId = networkService.getPlayerId();
      this.notifyListeners();
    });

    networkService.onNotification((message, type) => {
      this.showToast(message, type);
    });

    networkService.onConnectionChange((connected) => {
      this.connected = connected;
      if (connected) {
        this.showToast('已连接到服务器', 'success');
      } else {
        this.showToast('与服务器断开连接', 'error');
      }
    });

    // 连接到服务器
    networkService.connect(url, playerName, gameId);
  }

  /**
   * [CLIENT] 断开连接
   */
  public disconnect() {
    networkService.disconnect();
    this.state = null;
    this.playerId = null;
    this.connected = false;
  }

  // ==================== 客户端状态管理 ====================

  /**
   * [CLIENT] 订阅游戏状态变化
   */
  public subscribe(listener: GameListener) {
    this.listeners.push(listener);
    if (this.state) listener(this.state);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  /**
   * [CLIENT] 订阅通知消息
   */
  public onNotification(listener: NotificationListener) {
    this.notificationListeners.push(listener);
    return () => { this.notificationListeners = this.notificationListeners.filter(l => l !== listener); };
  }

  /**
   * [CLIENT] 订阅连接状态变化
   */
  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    // 转发到 networkService
    return networkService.onConnectionChange(callback);
  }

  /**
   * [CLIENT] 显示提示消息
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.notificationListeners.forEach(l => l(message, type));
  }

  /**
   * [CLIENT] 通知所有监听器状态已更新
   */
  private notifyListeners() {
    if (this.state) {
      const stateCopy = JSON.parse(JSON.stringify(this.state));
      this.listeners.forEach(l => l(stateCopy));
      this.checkVictory();
    }
  }

  /**
   * [SERVER] 检查胜利条件
   * 实际场景：应由服务器检查并广播游戏结束
   */
  private checkVictory() {
    if (!this.state || this.state.phase === GamePhase.GAME_OVER) return;
    const winner = this.state.players.find(p => p.victoryPoints >= 10);
    if (winner) {
      this.state.phase = GamePhase.GAME_OVER;
      this.state.log.unshift(`🏆 ${winner.name} 获得了胜利！`);
      this.showToast(`${winner.name} 获胜！`, "success");
    }
  }

  /**
   * [CLIENT] 获取当前玩家ID
   */
  public getPlayerId() { 
    return this.playerId || 'unknown'; 
  }

  /**
   * [CLIENT] 检查是否已连接
   */
  public isConnected() {
    return this.connected;
  }

  /**
   * [NETWORK] 同步状态到服务器
   * 在本地修改状态后调用此方法
   */
  private syncState(): void {
    if (!this.connected || !this.state) return;
    networkService.updateState(this.state);
  }

  // ==================== 游戏操作（本地执行 + 同步） ====================

  /**
   * [CLIENT] 掷骰子
   */
  public rollDice() {
    if (!this.state || this.state.phase === GamePhase.MAP_BUILDING || this.state.phase === GamePhase.SETUP || this.state.phase === GamePhase.GAME_OVER) return;
    if (this.state.currentPlayerId !== this.playerId) return;
    
    if (this.state.hasRolledDice) {
      this.showToast("本回合已经掷过骰子了。", "error");
      return;
    }
    
    // 生成随机数
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    this.state.dice = [d1, d2];
    this.state.hasRolledDice = true;
    
    const player = this.state.players.find(p => p.id === this.playerId);
    console.log(`[GameService] ${player?.name} 掷骰子: ${d1} + ${d2} = ${total}`);
    this.state.log.unshift(`🎲 ${player?.name} 掷出了 ${total}`);
    
    if (total === 7) {
      RobberService.handleSevenRoll(this.state);
    } else {
      ResourceService.distributeResources(this.state, total);
      this.state.phase = GamePhase.MAIN_TURN;
    }
    
    // 只同步状态到服务器，不立即通知本地监听器
    // 等待服务器广播后再更新UI，避免重复触发动画
    this.syncState();
  }

  /**
   * [CLIENT] 结束回合 / 锁定/解锁初始放置 / 确认地图构建
   */
  public endTurn() {
    if (!this.state || this.state.phase === GamePhase.GAME_OVER) return;
    
    const myPlayer = this.state.players.find(p => p.id === this.playerId)!;

    // 地图构建阶段：确认地图构建完成
    if (this.state.phase === GamePhase.MAP_BUILDING) {
      this.confirmMapBuilding();
      return;
    }

    if (this.state.phase === GamePhase.SETUP) {
      // 初始放置阶段：切换锁定状态
      if (!myPlayer.setupLocked) {
        // 锁定前检查是否完成放置
        if (myPlayer.setupSettlements < 2 || myPlayer.setupRoads < 2) {
          this.showToast("请先完成初始放置（2个定居点 + 2条道路）", "error");
          return;
        }
        
        myPlayer.setupLocked = true;
        this.state.log.unshift(`🔒 ${myPlayer.name} 锁定了初始放置`);
        this.showToast("初始放置已锁定！等待其他玩家...", "success");
      } else {
        // 解锁
        myPlayer.setupLocked = false;
        this.state.log.unshift(`🔓 ${myPlayer.name} 解锁了初始放置`);
        this.showToast("初始放置已解锁，可以继续调整", "info");
      }
      
      // 同步状态，让服务器检查是否所有玩家都锁定了
      this.notifyListeners();
      this.syncState();
      return;
    }
    
    // 正常游戏阶段：必须是自己的回合
    if (this.state.currentPlayerId !== this.playerId) {
      this.showToast("不是你的回合", "error");
      return;
    }
    
    if (this.state.phase === GamePhase.ROLL_DICE || !this.state.hasRolledDice) {
      this.showToast("请先掷骰子。", "error");
      return;
    }

    // 将所有发展卡标记为非新卡
    myPlayer.developmentCards.forEach(c => c.isNew = false);
    
    // 重置发展卡使用标记
    myPlayer.hasPlayedDevCard = false;
    
    // 切换到下一个玩家
    const currentIndex = this.state.players.findIndex(p => p.id === this.state!.currentPlayerId);
    const nextIndex = (currentIndex + 1) % this.state.players.length;
    this.state.currentPlayerId = this.state.players[nextIndex].id;
    this.state.phase = GamePhase.ROLL_DICE;
    this.state.hasRolledDice = false;
    
    console.log(`[GameService] 回合结束，切换到 ${this.state.players[nextIndex].name}`);
    this.state.log.unshift(`➡️ ${this.state.players[nextIndex].name} 的回合开始`);
    
    this.notifyListeners();
    this.syncState();
  }

  /**
   * [CLIENT] 撤销初始放置的建筑（定居点或城市）
   */
  public removeBuilding(vertexId: string) {
    if (!this.state || this.state.phase !== GamePhase.SETUP) return;
    
    const myPlayer = this.state.players.find(p => p.id === this.playerId)!;
    
    // 如果已锁定，不能撤销
    if (myPlayer.setupLocked) {
      this.showToast("已锁定，请先解锁才能撤销", "error");
      return;
    }
    
    const vertex = this.state.map.vertices.find(v => v.id === vertexId);
    if (!vertex || !vertex.building) return;
    
    // 只能撤销自己的建筑
    if (vertex.building.ownerId !== this.playerId) {
      this.showToast("不能撤销其他玩家的建筑", "error");
      return;
    }
    
    // 撤销建筑
    vertex.building = null;
    myPlayer.setupSettlements--;
    myPlayer.victoryPoints--;
    
    this.state.log.unshift(`↩️ ${myPlayer.name} 撤销了一个定居点`);
    this.showToast("已撤销定居点", "info");
    
    this.notifyListeners();
    this.syncState();
  }

  /**
   * [CLIENT] 撤销初始放置的道路
   */
  public removeRoad(edgeId: string) {
    if (!this.state || this.state.phase !== GamePhase.SETUP) return;
    
    const myPlayer = this.state.players.find(p => p.id === this.playerId)!;
    
    // 如果已锁定，不能撤销
    if (myPlayer.setupLocked) {
      this.showToast("已锁定，请先解锁才能撤销", "error");
      return;
    }
    
    const edge = this.state.map.edges.find(e => e.id === edgeId);
    if (!edge || !edge.road) return;
    
    // 只能撤销自己的道路
    if (edge.road.ownerId !== this.playerId) {
      this.showToast("不能撤销其他玩家的道路", "error");
      return;
    }
    
    // 撤销道路
    edge.road = null;
    myPlayer.setupRoads--;
    
    this.state.log.unshift(`↩️ ${myPlayer.name} 撤销了一条道路`);
    this.showToast("已撤销道路", "info");
    
    this.notifyListeners();
    this.syncState();
  }

  /**
   * [CLIENT] 建造道路
   */
  public buildRoad(edgeId: string, pId?: string) {
    if (!this.state) return;
    
    const playerId = pId || this.playerId!;
    
    if (BuildService.buildRoad(this.state, edgeId, playerId, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 处理顶点点击（建造定居点或升级城市）
   */
  public handleVertexClick(vertexId: string) {
    if (!this.state) return;
    
    const vertex = this.state.map.vertices.find(v => v.id === vertexId);
    if (!vertex) return;
    
    // 升级城市
    if (vertex.building) {
        if (this.state.phase === GamePhase.MAIN_TURN && 
            vertex.building.ownerId === this.playerId && 
            vertex.building.type === BuildingType.SETTLEMENT) {
            if (BuildService.upgradeToCity(this.state, vertexId, this.playerId!, this.showToast.bind(this))) {
              this.notifyListeners();
              this.syncState();
            }
        }
        return;
    }

    // 建造定居点
    if (this.canBuildSettlementAt(vertexId, this.playerId!)) {
        if (BuildService.buildSettlement(this.state, vertex, this.playerId!, this.showToast.bind(this))) {
          this.notifyListeners();
          this.syncState();
        }
    }
  }

  /**
   * [CLIENT] 弃掉资源（强盗事件）
   */
  public discardResources(discardResources: Partial<Record<ResourceType, number>>) {
    if (!this.state) return;
    
    if (RobberService.discardResources(this.state, this.playerId!, discardResources, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 移动强盗
   */
  public moveRobber(hexId: string) {
    if (!this.state) return;
    
    if (RobberService.moveRobber(this.state, hexId, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 偷取资源
   */
  public stealFrom(victimId: string) {
    if (!this.state) return;
    
    if (RobberService.stealFrom(this.state, victimId, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 购买发展卡
   */
  public buyDevelopmentCard() {
    if (!this.state) return;
    
    if (DevelopmentCardService.buyDevelopmentCard(this.state, this.playerId!, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 使用发展卡
   */
  public playDevelopmentCard(cardId: string) {
    if (!this.state) return;
    
    if (DevelopmentCardService.playDevelopmentCard(this.state, this.playerId!, cardId, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 选择丰饶卡的资源
   */
  public chooseYearOfPlentyResource(resource: ResourceType) {
    if (!this.state) return;
    
    if (DevelopmentCardService.chooseYearOfPlentyResource(this.state, resource, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 执行资源垄断
   */
  public executeMonopoly(resource: ResourceType) {
    if (!this.state) return;
    
    if (DevelopmentCardService.executeMonopoly(this.state, resource, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 取消发展卡动作
   */
  public cancelDevCardAction() {
    if (!this.state) return;
    
    DevelopmentCardService.cancelDevCardAction(this.state);
    this.notifyListeners();
    this.syncState();
  }

  /**
   * [CLIENT] 确认地图构建完成，进入初始放置阶段
   */
  public confirmMapBuilding() {
    if (!this.state || this.state.phase !== GamePhase.MAP_BUILDING) return;
    
    console.log(`[GameService] 地图构建完成，进入初始放置阶段`);
    
    this.state.phase = GamePhase.SETUP;
    this.state.log.unshift('🗺️ 地图构建完成！开始初始放置阶段');
    
    this.notifyListeners();
    this.syncState();
    this.showToast('地图构建完成，开始放置初始建筑', 'success');
  }

  /**
   * [CLIENT] 重新生成地图
   * @param terrainSeed 地形种子（可选，不提供则使用时间戳）
   * @param tokenSeed 点数种子（可选，不提供则使用时间戳）
   * @param portCount 港口数量（可选，不提供则使用当前值）
   */
  public regenerateMap(terrainSeed?: string, tokenSeed?: string, portCount?: number) {
    if (!this.state) return;
    
    const timestamp = Date.now();
    const finalTerrainSeed = terrainSeed || `terrain-${timestamp}`;
    const finalTokenSeed = tokenSeed || `token-${timestamp}`;
    const finalPortCount = portCount !== undefined ? portCount : this.state.portCount;
    
    console.log(`[GameService] 刷新地图 - 地形种子: ${finalTerrainSeed}, 点数种子: ${finalTokenSeed}, 港口数量: ${finalPortCount}`);
    
    const mapData = generateMap(finalTerrainSeed, finalTokenSeed, finalPortCount);
    
    this.state.map = mapData;
    this.state.terrainSeed = finalTerrainSeed;
    this.state.tokenSeed = finalTokenSeed;
    this.state.portCount = finalPortCount;
    this.state.log.unshift(`🗺️ 地图已刷新 (地形: ${finalTerrainSeed.substring(0, 20)}..., 点数: ${finalTokenSeed.substring(0, 20)}..., 港口: ${finalPortCount}个)`);
    
    this.notifyListeners();
    this.syncState();
    this.showToast('地图已刷新', 'success');
  }

  /**
   * [CLIENT] 重新生成点数
   * @param tokenSeed 点数种子（可选，不提供则使用时间戳）
   */
  public regenerateTokens(tokenSeed?: string) {
    if (!this.state) return;
    
    const timestamp = Date.now();
    const finalTokenSeed = tokenSeed || `token-${timestamp}`;
    
    console.log(`[GameService] 刷新点数 - 点数种子: ${finalTokenSeed}`);
    
    // 重新生成点数，保持地形种子和港口数量不变
    const mapData = generateMap(this.state.terrainSeed, finalTokenSeed, this.state.portCount);
    
    // 只更新点数，保持地形不变
    this.state.map.hexes.forEach((hex, index) => {
      hex.numberToken = mapData.hexes[index].numberToken;
    });
    
    this.state.tokenSeed = finalTokenSeed;
    this.state.log.unshift(`🎲 点数已刷新 (种子: ${finalTokenSeed.substring(0, 20)}...)`);
    
    this.notifyListeners();
    this.syncState();
    this.showToast('点数已刷新', 'success');
  }

  /**
   * [CLIENT] 开始游戏（进入初始放置阶段）
   */
  public startGame() {
    if (!this.state || this.state.phase !== GamePhase.SETUP) return;
    
    console.log(`[GameService] 开始游戏 - 进入初始放置阶段`);
    
    // 重置所有玩家的初始放置状态
    this.state.players.forEach(player => {
      player.setupSettlements = 0;
      player.setupRoads = 0;
      player.setupLocked = false;
      player.resources = {
        WOOD: 0,
        BRICK: 0,
        SHEEP: 0,
        WHEAT: 0,
        ORE: 0,
        DESERT: 0
      };
    });
    
    // 确保有当前玩家（如果没有，设置为第一个玩家）
    if (!this.state.currentPlayerId && this.state.players.length > 0) {
      this.state.currentPlayerId = this.state.players[0].id;
      console.log(`[GameService] 设置当前玩家为: ${this.state.players[0].name}`);
    }
    
    // 保持在 SETUP 阶段，但标记为已开始
    this.state.log.unshift('🎮 游戏开始！请放置初始定居点和道路');
    
    this.notifyListeners();
    this.syncState();
    this.showToast('游戏已开始，请放置初始建筑', 'success');
  }
  
  /**
   * [CLIENT] 切换调试模式（仅本地，不影响服务器）
   */
  public toggleDebugMode() {
    if (!this.state) return;
    this.state.debugMode = !this.state.debugMode;
    this.showToast(this.state.debugMode ? "调试模式已开启（仅本地）" : "调试模式已关闭", "info");
    this.notifyListeners();
  }

  /**
   * [CLIENT] 设置玩家资源（仅调试模式，仅本地）
   */
  public setPlayerResource(playerId: string, resource: ResourceType, amount: number) {
    if (!this.state || !this.state.debugMode) return;
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.resources[resource] = Math.max(0, amount);
      this.notifyListeners();
    }
  }

  // ==================== 交易相关 ====================

  /**
   * [CLIENT] 获取交易汇率
   * 基于玩家占领的港口计算
   */
  public getTradeRates(playerId: string) {
    if (!this.state) {
      return {
        [ResourceType.WOOD]: 4,
        [ResourceType.BRICK]: 4,
        [ResourceType.SHEEP]: 4,
        [ResourceType.WHEAT]: 4,
        [ResourceType.ORE]: 4,
        [ResourceType.DESERT]: 4
      };
    }
    return TradeService.getTradeRates(this.state, playerId);
  }

  /**
   * [CLIENT] 与银行交易
   */
  public tradeWithBank(giveResources: Partial<Record<ResourceType, number>>, get: ResourceType) {
    if (!this.state || (this.state.phase !== GamePhase.MAIN_TURN && this.state.phase !== GamePhase.ROLL_DICE)) return;
    
    if (TradeService.tradeWithBank(this.state, this.playerId!, giveResources, get, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 发起玩家间交易
   */
  public proposePlayerTrade(targetId: string, offer: Partial<Record<ResourceType, number>>, request: Partial<Record<ResourceType, number>>) {
    if (!this.state || this.state.phase !== GamePhase.MAIN_TURN) return;
    
    if (TradeService.proposePlayerTrade(this.state, this.playerId!, targetId, offer, request, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 接受交易
   */
  public acceptTrade() {
    if (!this.state) return;
    
    if (TradeService.acceptPlayerTrade(this.state, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 拒绝交易
   */
  public rejectTrade() {
    if (!this.state) return;
    
    if (TradeService.rejectPlayerTrade(this.state, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 取消交易
   */
  public cancelTrade() {
    if (!this.state) return;
    
    if (TradeService.cancelPlayerTrade(this.state, this.playerId!, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  /**
   * [CLIENT] 玩家间交易（旧方法）
   */
  public tradeWithPlayer(targetId: string, offer: Partial<Record<ResourceType, number>>, request: Partial<Record<ResourceType, number>>) {
    if (!this.state || this.state.phase !== GamePhase.MAIN_TURN) return;
    
    if (TradeService.tradeWithPlayer(this.state, this.playerId!, targetId, offer, request, this.showToast.bind(this))) {
      this.notifyListeners();
      this.syncState();
    }
  }

  // ==================== 建造相关（客户端验证） ====================

  /**
   * [CLIENT] 检查是否可以建造道路（仅用于UI显示）
   */
  public canBuildRoadAt(edgeId: string, pId: string): boolean {
    if (!this.state) return false;
    
    const edge = this.state.map.edges.find(e => e.id === edgeId);
    if (!edge || edge.road) return false;
    
    const hasOwnBuilding = edge.vertexIds.some(vId => 
      this.state!.map.vertices.find(v => v.id === vId)?.building?.ownerId === pId
    );
    
    const hasOwnRoad = edge.vertexIds.some(vId => 
      this.state!.map.edges.some(e => 
        e.road?.ownerId === pId && e.vertexIds.includes(vId)
      )
    );
    
    return hasOwnBuilding || hasOwnRoad;
  }

  /**
   * [CLIENT] 检查是否可以建造定居点（仅用于UI显示）
   */
  public canBuildSettlementAt(vertexId: string, pId: string): boolean {
    if (!this.state) return false;
    
    const vertex = this.state.map.vertices.find(v => v.id === vertexId);
    if (!vertex || vertex.building) return false;
    
    const neighborVIds = this.state.map.edges
      .filter(e => e.vertexIds.includes(vertexId))
      .map(e => e.vertexIds.find(id => id !== vertexId)!);
    
    if (neighborVIds.some(nid => this.state!.map.vertices.find(v => v.id === nid)?.building)) {
      return false;
    }
    
    if (this.state.phase === GamePhase.SETUP) return true;
    
    return this.state.map.edges.some(e => 
      e.road?.ownerId === pId && e.vertexIds.includes(vertexId)
    );
  }
}

export const gameService = new GameService();
