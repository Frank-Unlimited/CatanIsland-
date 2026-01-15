import { ResourceType, TerrainType } from './types';

export const TERRAIN_CONFIG: Record<TerrainType, { color: string; resource: ResourceType | null; name: string }> = {
  [TerrainType.FOREST]: { color: '#10b981', resource: ResourceType.WOOD, name: '森林' }, // Emerald 500
  [TerrainType.HILLS]: { color: '#f97316', resource: ResourceType.BRICK, name: '丘陵' }, // Orange 500
  [TerrainType.PASTURE]: { color: '#84cc16', resource: ResourceType.SHEEP, name: '草原' }, // Lime 500
  [TerrainType.FIELDS]: { color: '#eab308', resource: ResourceType.WHEAT, name: '田野' }, // Yellow 500
  [TerrainType.MOUNTAINS]: { color: '#64748b', resource: ResourceType.ORE, name: '山地' }, // Slate 500
  [TerrainType.DESERT]: { color: '#fde047', resource: null, name: '荒漠' }, // Yellow 300 (Sand)
};

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '木材',
  [ResourceType.BRICK]: '砖块',
  [ResourceType.SHEEP]: '羊毛',
  [ResourceType.WHEAT]: '粮食',
  [ResourceType.ORE]: '矿石',
  [ResourceType.DESERT]: '无',
};

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '#059669',
  [ResourceType.BRICK]: '#ea580c',
  [ResourceType.SHEEP]: '#65a30d',
  [ResourceType.WHEAT]: '#ca8a04',
  [ResourceType.ORE]: '#475569',
  [ResourceType.DESERT]: '#d4d4d8',
};

export const BUILDING_COSTS = {
  ROAD: { [ResourceType.WOOD]: 1, [ResourceType.BRICK]: 1 },
  SETTLEMENT: { [ResourceType.WOOD]: 1, [ResourceType.BRICK]: 1, [ResourceType.SHEEP]: 1, [ResourceType.WHEAT]: 1 },
  CITY: { [ResourceType.ORE]: 3, [ResourceType.WHEAT]: 2 },
  DEV_CARD: { [ResourceType.SHEEP]: 1, [ResourceType.WHEAT]: 1, [ResourceType.ORE]: 1 },
};

export const DEV_CARD_DESCRIPTIONS: Record<string, string> = {
  KNIGHT: '骑士 - 移动强盗并偷取资源',
  ROAD_BUILDING: '道路建设 - 免费建造2条道路',
  YEAR_OF_PLENTY: '丰收年 - 从银行获得2个任意资源',
  MONOPOLY: '垄断 - 所有玩家给你指定的一种资源',
  VICTORY_POINT: '胜利点 - 获得1个胜利点',
};

export const HEX_SIZE = 60; // Size of a hex side in pixels
