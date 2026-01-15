/**
 * 地图生成器（后端版本）
 * 从前端复制，用于服务器端生成地图
 */

import { Hex, Vertex, Edge, TerrainType, ResourceType, Port, MapData } from '../types';

const HEX_SIZE = 60;

class Random {
  private seed: number;
  constructor(seedStr: string) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    this.seed = Math.abs(hash) || 1;
  }
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

const RESOURCE_TILES = [
  TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST,
  TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE,
  TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS,
  TerrainType.HILLS, TerrainType.HILLS, TerrainType.HILLS,
  TerrainType.MOUNTAINS, TerrainType.MOUNTAINS, TerrainType.MOUNTAINS,
];

const NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

export function generateMap(terrainSeed: string, tokenSeed: string, portCount: number = 9): MapData {
  const terrainRng = new Random(terrainSeed);
  const tokenRng = new Random(tokenSeed);

  const hexes: Hex[] = [];
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];
  const ports: Port[] = [];
  
  const hexCoords: {q: number, r: number}[] = [];
  const range = 2;
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      hexCoords.push({ q, r });
    }
  }

  const shuffledResources = terrainRng.shuffle(RESOURCE_TILES);
  const shuffledTokens = tokenRng.shuffle(NUMBER_TOKENS);
  
  let resIdx = 0;
  let tokenIdx = 0;

  hexCoords.forEach(coord => {
    const isCenter = coord.q === 0 && coord.r === 0;
    const terrain = isCenter ? TerrainType.DESERT : shuffledResources[resIdx++];
    const token = isCenter ? null : shuffledTokens[tokenIdx++];
    
    hexes.push({
      id: `h_${coord.q}_${coord.r}`,
      q: coord.q, r: coord.r, s: -coord.q - coord.r,
      terrain,
      numberToken: token,
      hasRobber: isCenter
    });
  });

  const vertexMap = new Map<string, Vertex>();
  const getVertex = (vx: number, vy: number) => {
    const key = `${vx.toFixed(2)},${vy.toFixed(2)}`;
    if (!vertexMap.has(key)) {
      const v = { id: `v_${key}`, x: vx, y: vy, building: null };
      vertexMap.set(key, v);
      vertices.push(v);
    }
    return vertexMap.get(key)!;
  };

  const edgeMap = new Map<string, Edge>();
  const edgeToHexMap = new Map<string, string[]>();

  hexes.forEach(hex => {
    const center = hexToPixel(hex.q, hex.r);
    const hexVIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const vx = center.x + HEX_SIZE * Math.cos(angle);
      const vy = center.y + HEX_SIZE * Math.sin(angle);
      hexVIds.push(getVertex(vx, vy).id);
    }

    for (let i = 0; i < 6; i++) {
      const v1Id = hexVIds[i];
      const v2Id = hexVIds[(i + 1) % 6];
      const eId = [v1Id, v2Id].sort().join('_');
      
      if (!edgeMap.has(eId)) {
        const edge = { id: eId, vertexIds: [v1Id, v2Id] as [string, string], road: null };
        edgeMap.set(eId, edge);
        edges.push(edge);
      }
      const hexList = edgeToHexMap.get(eId) || [];
      hexList.push(hex.id);
      edgeToHexMap.set(eId, hexList);
    }
  });

  const coastalEdges = edges.filter(e => {
    const hexList = edgeToHexMap.get(e.id);
    return hexList && hexList.length === 1;
  });
  
  console.log(`[MapGenerator] 总边数: ${edges.length}, 海岸线边数: ${coastalEdges.length}`);
  
  coastalEdges.sort((a, b) => {
    const v1a = vertices.find(v => v.id === a.vertexIds[0])!;
    const v2a = vertices.find(v => v.id === a.vertexIds[1])!;
    const angleA = Math.atan2((v1a.y + v2a.y) / 2, (v1a.x + v2a.x) / 2);
    
    const v1b = vertices.find(v => v.id === b.vertexIds[0])!;
    const v2b = vertices.find(v => v.id === b.vertexIds[1])!;
    const angleB = Math.atan2((v1b.y + v2b.y) / 2, (v1b.x + v2b.x) / 2);
    
    return angleA - angleB;
  });

  // 根据 portCount 生成港口配置
  // 标准配置：4个通用3:1 + 5个特殊资源2:1 = 9个港口
  // 如果 portCount 不同，按比例调整
  const standardPorts: {type: 'ANY' | ResourceType, ratio: number}[] = [
    { type: 'ANY', ratio: 3 },              // 通用港口
    { type: ResourceType.WOOD, ratio: 2 },  // 木材港口
    { type: 'ANY', ratio: 3 },              // 通用港口
    { type: ResourceType.BRICK, ratio: 2 }, // 砖块港口
    { type: ResourceType.SHEEP, ratio: 2 }, // 羊毛港口
    { type: 'ANY', ratio: 3 },              // 通用港口
    { type: ResourceType.WHEAT, ratio: 2 }, // 粮食港口
    { type: ResourceType.ORE, ratio: 2 },   // 矿石港口
    { type: 'ANY', ratio: 3 },              // 通用港口
  ];
  
  // 根据 portCount 截取或重复港口配置
  const portConfigs: {type: 'ANY' | ResourceType, ratio: number}[] = [];
  for (let i = 0; i < portCount; i++) {
    portConfigs.push(standardPorts[i % standardPorts.length]);
  }

  const totalCoastalEdges = coastalEdges.length;
  const totalPorts = portConfigs.length;
  
  console.log(`[MapGenerator] 海岸线边数量: ${totalCoastalEdges}, 港口数量: ${totalPorts}`);
  
  let successfulPorts = 0;
  let attemptIndex = 0;
  
  while (successfulPorts < totalPorts && attemptIndex < totalCoastalEdges * 2) {
    // 使用更均匀的分布算法，确保港口分散在海岸线上
    const edgeIndex = Math.floor((attemptIndex * totalCoastalEdges) / totalPorts) % totalCoastalEdges;
    const edge = coastalEdges[edgeIndex];
    const config = portConfigs[successfulPorts];
    const pId = `p_${successfulPorts}`;
    
    attemptIndex++;
    
    // 验证这条边确实是海岸线边（只属于1个六边形）
    const hexIds = edgeToHexMap.get(edge.id);
    if (!hexIds || hexIds.length !== 1) {
      console.warn(`[MapGenerator] 边 ${edge.id} 不是有效的海岸线边 (hexIds.length=${hexIds?.length})，跳过`);
      continue;
    }
    
    const ownerHexId = hexIds[0];
    const ownerHex = hexes.find(h => h.id === ownerHexId);
    if (!ownerHex) {
      console.warn(`[MapGenerator] 无法找到六边形 ${ownerHexId}，跳过`);
      continue;
    }
    
    // 验证六边形是否在地图边缘（半径为2的地图，边缘六边形满足 |q|==2 || |r|==2 || |s|==2）
    const isEdgeHex = Math.abs(ownerHex.q) === 2 || Math.abs(ownerHex.r) === 2 || Math.abs(ownerHex.s) === 2;
    if (!isEdgeHex) {
      console.warn(`[MapGenerator] 六边形 ${ownerHexId} (q=${ownerHex.q}, r=${ownerHex.r}, s=${ownerHex.s}) 不在地图边缘，跳过`);
      continue;
    }
    
    const hexPos = hexToPixel(ownerHex.q, ownerHex.r);
    
    const v1 = vertices.find(v => v.id === edge.vertexIds[0])!;
    const v2 = vertices.find(v => v.id === edge.vertexIds[1])!;
    const edgeMidX = (v1.x + v2.x) / 2;
    const edgeMidY = (v1.y + v2.y) / 2;
    
    // 验证边是否真的在外围：边中点到地图中心的距离应该大于六边形中心到地图中心的距离
    const edgeDistToCenter = Math.sqrt(edgeMidX * edgeMidX + edgeMidY * edgeMidY);
    const hexDistToCenter = Math.sqrt(hexPos.x * hexPos.x + hexPos.y * hexPos.y);
    
    if (edgeDistToCenter <= hexDistToCenter * 1.05) { // 增加5%的容差
      console.warn(`[MapGenerator] 边 ${edge.id} 不够外围 (边距离=${edgeDistToCenter.toFixed(1)}, 六边形距离=${hexDistToCenter.toFixed(1)})，跳过`);
      continue;
    }
    
    // 验证边的两个顶点到地图中心的距离都应该足够大（在外围）
    const v1DistToCenter = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const v2DistToCenter = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const minVertexDist = Math.min(v1DistToCenter, v2DistToCenter);
    
    // 外围顶点的距离应该大于 HEX_SIZE * 1.8
    if (minVertexDist < HEX_SIZE * 1.8) {
      console.warn(`[MapGenerator] 边 ${edge.id} 的顶点不够外围 (v1=${v1DistToCenter.toFixed(1)}, v2=${v2DistToCenter.toFixed(1)})，跳过`);
      continue;
    }
    
    // 计算朝外向量：从六边形中心指向边中点（指向海洋）
    const dx = edgeMidX - hexPos.x;
    const dy = edgeMidY - hexPos.y;
    const mag = Math.sqrt(dx*dx + dy*dy) || 1; // 防止除以0
    const outwardVector = { x: dx / mag, y: dy / mag };
    
    console.log(`[MapGenerator] ✓ 港口 ${successfulPorts} 验证通过: hex(${ownerHex.q},${ownerHex.r},${ownerHex.s}) edge(${edge.id}) 边距离=${edgeDistToCenter.toFixed(1)} > 六边形距离=${hexDistToCenter.toFixed(1)}, 顶点距离=(${v1DistToCenter.toFixed(1)}, ${v2DistToCenter.toFixed(1)})`);
    
    const port: Port = {
      id: pId,
      type: config.type,
      ratio: config.ratio,
      vertexIds: [edge.vertexIds[0], edge.vertexIds[1]],
      outwardVector
    };
    ports.push(port);
    
    // 标记顶点拥有港口
    v1.portId = pId;
    v2.portId = pId;
    
    successfulPorts++;
  }
  
  if (successfulPorts < totalPorts) {
    console.warn(`[MapGenerator] 警告：只成功生成了 ${successfulPorts}/${totalPorts} 个港口`);
  }

  return { hexes, vertices, edges, ports };
}
