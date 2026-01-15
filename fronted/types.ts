
export enum ResourceType {
  WOOD = 'WOOD',
  BRICK = 'BRICK',
  SHEEP = 'SHEEP',
  WHEAT = 'WHEAT',
  ORE = 'ORE',
  DESERT = 'DESERT',
}

export enum TerrainType {
  FOREST = 'FOREST',
  HILLS = 'HILLS',
  PASTURE = 'PASTURE',
  FIELDS = 'FIELDS',
  MOUNTAINS = 'MOUNTAINS',
  DESERT = 'DESERT',
}

export enum BuildingType {
  ROAD = 'ROAD',
  SETTLEMENT = 'SETTLEMENT',
  CITY = 'CITY',
}

export enum GamePhase {
  MAP_BUILDING = 'MAP_BUILDING', // 地图构建阶段
  SETUP = 'SETUP',
  ROLL_DICE = 'ROLL_DICE',
  MAIN_TURN = 'MAIN_TURN',
  ROBBER_PLACEMENT = 'ROBBER_PLACEMENT',
  ROBBER_STEAL = 'ROBBER_STEAL',
  DISCARD_RESOURCES = 'DISCARD_RESOURCES', // 玩家选择弃牌阶段
  GAME_OVER = 'GAME_OVER',
}

export enum DevCardType {
  KNIGHT = 'KNIGHT',
  ROAD_BUILDING = 'ROAD_BUILDING',
  YEAR_OF_PLENTY = 'YEAR_OF_PLENTY',
  MONOPOLY = 'MONOPOLY',
  VICTORY_POINT = 'VICTORY_POINT',
}

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Record<ResourceType, number>;
  victoryPoints: number; // 实际胜利点（包含胜利点卡）
  roadLength: number;
  armySize: number;
  setupSettlements: number;
  setupRoads: number;
  setupLocked: boolean; // 初始放置是否已锁定
  developmentCards: {
    type: DevCardType;
    isNew: boolean;
    id: string;
  }[];
  hasPlayedDevCard: boolean; // 本回合是否已使用发展卡
  hiddenVictoryPoints: number; // 隐藏的胜利点（来自胜利点卡）
}

export interface Hex {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: TerrainType;
  numberToken: number | null;
  hasRobber: boolean;
}

export interface Port {
  id: string;
  type: 'ANY' | ResourceType;
  ratio: number;
  vertexIds: [string, string];
  outwardVector: { x: number, y: number };
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  portId?: string;
  building: {
    type: BuildingType.SETTLEMENT | BuildingType.CITY;
    ownerId: string;
  } | null;
}

export interface Edge {
  id: string;
  vertexIds: [string, string];
  road: {
    ownerId: string;
  } | null;
}

export interface GameState {
  gameId: string;
  terrainSeed: string;
  tokenSeed: string;
  portCount: number; // 港口数量
  players: Player[];
  currentPlayerId: string;
  phase: GamePhase;
  map: {
    hexes: Hex[];
    vertices: Vertex[];
    edges: Edge[];
    ports: Port[];
  };
  dice: [number, number];
  log: string[];
  debugMode: boolean;
  stealingFrom: string[];
  hasRolledDice: boolean;
  tradeOffer?: TradeOffer; // 当前的交易提案
  discardingPlayers?: string[]; // 需要弃牌的玩家ID列表
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

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId: string;
  offer: Partial<Record<ResourceType, number>>; // 发起者给出的资源
  request: Partial<Record<ResourceType, number>>; // 发起者需要的资源
}

export type CatanMessage = 
  | { type: 'BUILD_ROAD', edgeId: string }
  | { type: 'BUILD_SETTLEMENT', vertexId: string }
  | { type: 'UPGRADE_CITY', vertexId: string }
  | { type: 'ROLL_DICE' }
  | { type: 'END_TURN' }
  | { type: 'MOVE_ROBBER', hexId: string }
  | { type: 'TRADE_PLAYER', targetId: string, offer: Partial<Record<ResourceType, number>>, request: Partial<Record<ResourceType, number>> }
  | { type: 'TRADE_BANK', give: ResourceType, get: ResourceType }
  | { type: 'BUY_DEV_CARD' }
  | { type: 'PLAY_DEV_CARD', cardId: string }
  | { type: 'GAME_STATE_UPDATE', state: GameState };
