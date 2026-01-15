/**
 * 后端类型定义
 * 与前端类型保持一致
 */

// 资源类型
export enum ResourceType {
  WOOD = 'WOOD',
  BRICK = 'BRICK',
  SHEEP = 'SHEEP',
  WHEAT = 'WHEAT',
  ORE = 'ORE',
  DESERT = 'DESERT'
}

// 地形类型
export enum TerrainType {
  FOREST = 'FOREST',
  HILLS = 'HILLS',
  PASTURE = 'PASTURE',
  FIELDS = 'FIELDS',
  MOUNTAINS = 'MOUNTAINS',
  DESERT = 'DESERT'
}

// 建筑类型
export enum BuildingType {
  SETTLEMENT = 'SETTLEMENT',
  CITY = 'CITY'
}

// 游戏阶段
export enum GamePhase {
  MAP_BUILDING = 'MAP_BUILDING', // 地图构建阶段
  SETUP = 'SETUP',
  ROLL_DICE = 'ROLL_DICE',
  MAIN_TURN = 'MAIN_TURN',
  ROBBER_PLACEMENT = 'ROBBER_PLACEMENT',
  ROBBER_STEAL = 'ROBBER_STEAL',
  GAME_OVER = 'GAME_OVER'
}

// 发展卡类型
export enum DevCardType {
  KNIGHT = 'KNIGHT',
  VICTORY_POINT = 'VICTORY_POINT',
  ROAD_BUILDING = 'ROAD_BUILDING',
  YEAR_OF_PLENTY = 'YEAR_OF_PLENTY',
  MONOPOLY = 'MONOPOLY'
}

// 玩家资源
export type PlayerResources = Record<ResourceType, number>;

// 建筑
export interface Building {
  type: BuildingType;
  ownerId: string;
}

// 道路
export interface Road {
  ownerId: string;
}

// 发展卡
export interface DevelopmentCard {
  id: string;
  type: DevCardType;
  isNew: boolean;
}

// 玩家
export interface Player {
  id: string;
  name: string;
  color: string;
  resources: PlayerResources;
  victoryPoints: number;
  roadLength: number;
  armySize: number;
  setupSettlements: number;
  setupRoads: number;
  setupLocked: boolean; // 初始放置是否已锁定
  developmentCards: DevelopmentCard[];
  hasPlayedDevCard: boolean; // 本回合是否已使用发展卡
  hiddenVictoryPoints: number; // 隐藏的胜利点（来自胜利点卡）
}

// 六边形地块
export interface Hex {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: TerrainType;
  numberToken: number | null;
  hasRobber: boolean;
}

// 顶点
export interface Vertex {
  id: string;
  x: number;
  y: number;
  building: Building | null;
  portId?: string;
}

// 边
export interface Edge {
  id: string;
  vertexIds: [string, string];
  road: Road | null;
}

// 港口
export interface Port {
  id: string;
  type: 'ANY' | ResourceType;
  ratio: number;
  vertexIds: [string, string];
  outwardVector: { x: number; y: number };
}

// 地图数据
export interface MapData {
  hexes: Hex[];
  vertices: Vertex[];
  edges: Edge[];
  ports: Port[];
}

// 游戏状态
export interface GameState {
  gameId: string;
  terrainSeed: string;
  tokenSeed: string;
  portCount: number; // 港口数量
  players: Player[];
  currentPlayerId: string;
  phase: GamePhase;
  map: MapData;
  dice: [number, number];
  log: string[];
  debugMode: boolean;
  stealingFrom: string[];
  hasRolledDice: boolean; // 当前回合是否已掷骰子
  largestArmyPlayerId?: string; // 拥有"最大骑士奖"的玩家ID
  devCardAction?: { // 发展卡使用中的特殊状态
    type: 'ROAD_BUILDING' | 'YEAR_OF_PLENTY' | 'MONOPOLY';
    playerId: string;
    data?: any;
  };
  cardAnimation?: { // 卡牌动画（广播给所有玩家）
    cardType: 'RESOURCE' | 'DEVELOPMENT';
    card: ResourceType | DevCardType;
    count: number;
    playerName: string;
    action: 'GAIN' | 'USE';
    timestamp: number;
  };
}

// WebSocket 消息类型
export enum MessageType {
  // 客户端 -> 服务器
  JOIN_GAME = 'JOIN_GAME',
  UPDATE_STATE = 'UPDATE_STATE',  // 客户端更新游戏状态
  
  // 服务器 -> 客户端
  PLAYER_ID = 'PLAYER_ID',
  GAME_STATE = 'GAME_STATE',      // 广播游戏状态
  ERROR = 'ERROR',
  NOTIFICATION = 'NOTIFICATION'
}

// WebSocket 消息
export interface WSMessage {
  type: MessageType;
  payload?: any;
}

// 游戏房间
export interface GameRoom {
  gameId: string;
  state: GameState;
  clients: Map<string, any>; // playerId -> WebSocket
}
