/**
 * 发展卡服务
 * 处理发展卡的购买和使用
 */

import { GameState, GamePhase, DevCardType, ResourceType } from '../types';
import { animationService } from './animationService';

export class DevelopmentCardService {
  /**
   * 购买发展卡
   * 消耗：1羊毛 + 1粮食 + 1矿石
   * 发展卡类型：
   * - 骑士卡（14张）：移动强盗并偷取资源，累计3张可获得"最大骑士奖"（2胜利点）
   * - 道路建设卡（2张）：免费建造2条道路
   * - 丰饶卡（2张）：从银行获得2张任意资源
   * - 资源垄断卡（2张）：指定一种资源，所有其他玩家交出该资源
   * - 胜利点卡（5张）：直接获得1胜利点
   */
  static buyDevelopmentCard(
    state: GameState,
    playerId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      if (state.phase !== GamePhase.MAIN_TURN) {
        showToast("只能在主回合购买发展卡。", "error");
        return false;
      }

      const player = state.players.find(p => p.id === playerId);
      if (!player) return false;
      
      // 检查资源是否足够
      if (player.resources.SHEEP < 1 || player.resources.WHEAT < 1 || player.resources.ORE < 1) {
          showToast("资源不足，需要 1 羊毛 + 1 粮食 + 1 矿石。", "error");
          return false;
      }

      // 扣除资源
      player.resources.SHEEP--;
      player.resources.WHEAT--;
      player.resources.ORE--;
      
      // 从卡池中随机抽取一张（按标准比例）
      const pool = [
          ...Array(14).fill(DevCardType.KNIGHT),
          ...Array(2).fill(DevCardType.ROAD_BUILDING),
          ...Array(2).fill(DevCardType.YEAR_OF_PLENTY),
          ...Array(2).fill(DevCardType.MONOPOLY),
          ...Array(5).fill(DevCardType.VICTORY_POINT)
      ];
      const type = pool[Math.floor(Math.random() * pool.length)] as DevCardType;
      
      // 添加到玩家手牌，标记为新卡（当回合不能使用）
      player.developmentCards.push({ id: `c-${Date.now()}-${Math.random()}`, type, isNew: true });
      
      // 触发卡牌获取动画（只对本人显示）
      animationService.showCardGain('DEVELOPMENT', type, 1, player.name, 'GAIN');
      
      // 胜利点卡立即计入隐藏分数（但不显示给其他玩家）
      if (type === DevCardType.VICTORY_POINT) {
          player.hiddenVictoryPoints++;
          player.victoryPoints++;
          state.log.unshift(`${player.name} 购买了一张发展卡。`);
          showToast("购买成功！获得了胜利点卡！", "success");
      } else {
          state.log.unshift(`${player.name} 购买了一张发展卡。`);
          showToast(`购买成功！获得了${this.getCardName(type)}！`, "success");
      }
      
      return true;
  }

  /**
   * 使用发展卡
   * 规则：
   * - 每回合只能打出1张发展卡（骑士卡除外）
   * - 不能使用当回合购买的卡
   * - 骑士卡可以在掷骰前使用
   * - 其他卡只能在掷骰后使用
   */
  static playDevelopmentCard(
    state: GameState,
    playerId: string,
    cardId: string,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      const player = state.players.find(p => p.id === playerId);
      if (!player) return false;

      const idx = player.developmentCards.findIndex(c => c.id === cardId);
      if (idx === -1) return false;
      
      const card = player.developmentCards[idx];
      
      // 检查是否是当回合购买的卡
      if (card.isNew) {
          showToast("当回合购买的卡牌不能立即使用。", "error");
          return false;
      }

      // 检查是否已使用过发展卡（骑士卡除外）
      if (player.hasPlayedDevCard && card.type !== DevCardType.KNIGHT) {
          showToast("每回合只能使用一张发展卡。", "error");
          return false;
      }

      // 骑士卡可以在掷骰前使用，其他卡只能在掷骰后使用
      if (card.type === DevCardType.KNIGHT) {
          if (state.phase !== GamePhase.ROLL_DICE && state.phase !== GamePhase.MAIN_TURN) {
              showToast("骑士卡只能在自己的回合使用。", "error");
              return false;
          }
      } else {
          if (state.phase !== GamePhase.MAIN_TURN || !state.hasRolledDice) {
              showToast("此卡牌只能在掷骰后使用。", "error");
              return false;
          }
      }
      
      // 从手牌中移除已使用的卡
      player.developmentCards.splice(idx, 1);
      player.hasPlayedDevCard = true;
      
      // 根据卡牌类型执行不同效果
      switch (card.type) {
          case DevCardType.KNIGHT:
              return this.playKnightCard(state, player, showToast);
          
          case DevCardType.ROAD_BUILDING:
              return this.playRoadBuildingCard(state, player, showToast);
          
          case DevCardType.YEAR_OF_PLENTY:
              return this.playYearOfPlentyCard(state, player, showToast);
          
          case DevCardType.MONOPOLY:
              return this.playMonopolyCard(state, player, showToast);
          
          case DevCardType.VICTORY_POINT:
              // 胜利点卡不应该被打出（购买时已计分）
              showToast("胜利点卡无需打出，已自动计分。", "info");
              return false;
      }
      
      return true;
  }

  /**
   * 使用骑士卡
   * 效果：移动强盗，随机偷取资源，增加军队数量
   */
  private static playKnightCard(
    state: GameState,
    player: any,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      player.armySize++;
      state.phase = GamePhase.ROBBER_PLACEMENT;
      
      // 广播动画给所有玩家
      state.cardAnimation = {
        cardType: 'DEVELOPMENT',
        card: DevCardType.KNIGHT,
        count: 1,
        playerName: player.name,
        action: 'USE',
        timestamp: Date.now()
      };
      
      state.log.unshift(`⚔️ ${player.name} 使用了骑士卡！骑士出动，请移动强盗。`);
      showToast("骑士出动！请选择强盗的新位置。", "info");
      
      // 检查是否获得"最大骑士奖"（需要至少3张骑士卡）
      this.checkLargestArmy(state, player);
      
      return true;
  }

  /**
   * 使用道路建设卡
   * 效果：免费建造2条道路
   */
  private static playRoadBuildingCard(
    state: GameState,
    player: any,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      state.devCardAction = {
          type: 'ROAD_BUILDING',
          playerId: player.id,
          data: { roadsBuilt: 0 }
      };
      
      // 广播动画给所有玩家
      state.cardAnimation = {
        cardType: 'DEVELOPMENT',
        card: DevCardType.ROAD_BUILDING,
        count: 1,
        playerName: player.name,
        action: 'USE',
        timestamp: Date.now()
      };
      
      state.log.unshift(`🛤️ ${player.name} 使用了道路建设卡！可以免费建造2条道路。`);
      showToast("请在地图上选择位置建造2条道路。", "info");
      return true;
  }

  /**
   * 使用丰饶卡
   * 效果：从银行获得2张任意资源
   */
  private static playYearOfPlentyCard(
    state: GameState,
    player: any,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      state.devCardAction = {
          type: 'YEAR_OF_PLENTY',
          playerId: player.id,
          data: { resourcesChosen: 0 }
      };
      
      // 广播动画给所有玩家
      state.cardAnimation = {
        cardType: 'DEVELOPMENT',
        card: DevCardType.YEAR_OF_PLENTY,
        count: 1,
        playerName: player.name,
        action: 'USE',
        timestamp: Date.now()
      };
      
      state.log.unshift(`🌾 ${player.name} 使用了丰饶卡！可以选择2张任意资源。`);
      showToast("请选择2张任意资源。", "info");
      return true;
  }

  /**
   * 使用资源垄断卡
   * 效果：指定一种资源，收集所有其他玩家的该资源
   */
  private static playMonopolyCard(
    state: GameState,
    player: any,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      state.devCardAction = {
          type: 'MONOPOLY',
          playerId: player.id
      };
      
      // 广播动画给所有玩家
      state.cardAnimation = {
        cardType: 'DEVELOPMENT',
        card: DevCardType.MONOPOLY,
        count: 1,
        playerName: player.name,
        action: 'USE',
        timestamp: Date.now()
      };
      
      state.log.unshift(`💰 ${player.name} 使用了资源垄断卡！请选择要垄断的资源。`);
      showToast("请选择要垄断的资源类型。", "info");
      return true;
  }

  /**
   * 检查并更新"最大骑士奖"
   */
  private static checkLargestArmy(state: GameState, player: any): void {
      if (player.armySize < 3) return;
      
      const currentHolder = state.players.find(p => p.id === state.largestArmyPlayerId);
      
      // 如果没有人持有，或者当前玩家军队数量更多，则获得奖励
      if (!currentHolder || player.armySize > currentHolder.armySize) {
          // 移除旧持有者的分数
          if (currentHolder) {
              currentHolder.victoryPoints -= 2;
              state.log.unshift(`⚔️ ${currentHolder.name} 失去了"最大骑士奖"（-2分）。`);
          }
          
          // 授予新持有者
          state.largestArmyPlayerId = player.id;
          player.victoryPoints += 2;
          state.log.unshift(`🏆 ${player.name} 获得了"最大骑士奖"（+2分）！当前军队规模：${player.armySize}`);
      } else if (player.armySize === currentHolder.armySize && player.id !== currentHolder.id) {
          // 平局，原持有者保留
          state.log.unshift(`⚔️ ${player.name} 的军队规模达到 ${player.armySize}，与 ${currentHolder.name} 持平，但"最大骑士奖"仍由 ${currentHolder.name} 保持。`);
      }
  }

  /**
   * 完成道路建设卡的道路建造
   */
  static completeRoadBuilding(state: GameState, edgeId: string): boolean {
      if (!state.devCardAction || state.devCardAction.type !== 'ROAD_BUILDING') {
          return false;
      }
      
      const player = state.players.find(p => p.id === state.devCardAction!.playerId);
      if (!player) return false;
      
      const edge = state.map.edges.find(e => e.id === edgeId);
      if (!edge || edge.road) return false;
      
      // 建造道路（免费）
      edge.road = { ownerId: player.id };
      state.devCardAction.data.roadsBuilt++;
      
      state.log.unshift(`${player.name} 建造了一条免费道路。`);
      
      // 如果已建造2条，清除状态
      if (state.devCardAction.data.roadsBuilt >= 2) {
          state.devCardAction = undefined;
          state.log.unshift(`${player.name} 完成了道路建设。`);
      }
      
      return true;
  }

  /**
   * 选择丰饶卡的资源
   */
  static chooseYearOfPlentyResource(
    state: GameState,
    resource: ResourceType,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      if (!state.devCardAction || state.devCardAction.type !== 'YEAR_OF_PLENTY') {
          return false;
      }
      
      const player = state.players.find(p => p.id === state.devCardAction!.playerId);
      if (!player) return false;
      
      // 添加资源
      player.resources[resource]++;
      state.devCardAction.data.resourcesChosen++;
      
      // 触发资源卡获取动画（只对本人显示）
      animationService.showCardGain('RESOURCE', resource, 1, player.name, 'GAIN');
      
      state.log.unshift(`📦 ${player.name} 从银行获得了 1 张 ${resource}。`);
      
      // 如果已选择2张，清除状态
      if (state.devCardAction.data.resourcesChosen >= 2) {
          state.devCardAction = undefined;
          state.log.unshift(`✅ ${player.name} 完成了丰饶卡的资源选择。`);
          showToast("资源已添加到手牌。", "success");
      } else {
          showToast(`已选择1张，还可以选择1张。`, "info");
      }
      
      return true;
  }

  /**
   * 执行资源垄断
   */
  static executeMonopoly(
    state: GameState,
    resource: ResourceType,
    showToast: (message: string, type: 'success' | 'error' | 'info') => void
  ): boolean {
      if (!state.devCardAction || state.devCardAction.type !== 'MONOPOLY') {
          return false;
      }
      
      const player = state.players.find(p => p.id === state.devCardAction!.playerId);
      if (!player) return false;
      
      let totalCollected = 0;
      const victims: string[] = [];
      
      // 收集所有其他玩家的指定资源
      state.players.forEach(p => {
          if (p.id !== player.id) {
              const amount = p.resources[resource];
              if (amount > 0) {
                  totalCollected += amount;
                  p.resources[resource] = 0;
                  victims.push(p.name);
                  state.log.unshift(`📤 ${p.name} 交出了 ${amount} 张 ${resource}。`);
              }
          }
      });
      
      player.resources[resource] += totalCollected;
      state.devCardAction = undefined;
      
      // 触发资源卡获取动画（只对本人显示）
      if (totalCollected > 0) {
        animationService.showCardGain('RESOURCE', resource, totalCollected, player.name, 'GAIN');
      }
      
      if (totalCollected > 0) {
        state.log.unshift(`💰 ${player.name} 垄断了 ${resource}，从 ${victims.join('、')} 处共收集了 ${totalCollected} 张！`);
        showToast(`成功收集了 ${totalCollected} 张 ${resource}！`, "success");
      } else {
        state.log.unshift(`💰 ${player.name} 垄断了 ${resource}，但其他玩家都没有该资源。`);
        showToast(`其他玩家都没有 ${resource}。`, "info");
      }
      
      return true;
  }

  /**
   * 取消发展卡动作
   */
  static cancelDevCardAction(state: GameState): void {
      state.devCardAction = undefined;
  }

  /**
   * 获取卡牌名称
   */
  private static getCardName(type: DevCardType): string {
      const names: Record<DevCardType, string> = {
          [DevCardType.KNIGHT]: '骑士卡',
          [DevCardType.ROAD_BUILDING]: '道路建设卡',
          [DevCardType.YEAR_OF_PLENTY]: '丰饶卡',
          [DevCardType.MONOPOLY]: '资源垄断卡',
          [DevCardType.VICTORY_POINT]: '胜利点卡'
      };
      return names[type];
  }
}
