import { Hex, Vertex, Edge, TerrainType, ResourceType, Port } from '../types';
import { HEX_SIZE } from '../constants';

/**
 * 伪随机数生成器
 * 使用种子字符串生成可重复的随机序列，确保相同种子产生相同的地图布局
 */
class Random {
  private seed: number;
  
  constructor(seedStr: string) {
    // 将字符串转换为数字种子
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    this.seed = Math.abs(hash) || 1;
  }
  
  /**
   * 生成下一个随机数（0-1之间）
   */
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  
  /**
   * 随机打乱数组
   */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

/**
 * 资源地形板块配置（共18块，不包括沙漠）
 * 森林4块、草原4块、田野4块、丘陵3块、山地3块
 */
const RESOURCE_TILES = [
  TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST,
  TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE,
  TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS,
  TerrainType.HILLS, TerrainType.HILLS, TerrainType.HILLS,
  TerrainType.MOUNTAINS, TerrainType.MOUNTAINS, TerrainType.MOUNTAINS,
];

/**
 * 数字圆片配置（共18个，不包括7）
 * 6和8各2个（红色高概率），其他数字按概率分布
 */
const NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

/**
 * 港口配置：4个3:1通用港口 + 5个2:1特殊资源港口（标准配置）
 */
const STANDARD_PORT_CONFIGS: {type: 'ANY' | ResourceType, ratio: number}[] = [
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

/**
 * 将六边形坐标（q, r）转换为像素坐标（x, y）
 * 使用平顶六边形布局
 */
function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

/**
 * 生成六边形坐标数组（半径为2的正六边形区域，共19个）
 * @returns 六边形坐标数组 {q: number, r: number}[]
 */
function generateHexCoordinates(): {q: number, r: number}[] {
  const hexCoords: {q: number, r: number}[] = [];
  const range = 2;
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      hexCoords.push({ q, r });
    }
  }
  return hexCoords;
}

/**
 * 生成六边形数据（地形+数字圆片）
 * @param hexCoords 六边形坐标数组
 * @param terrainRng 地形随机数生成器
 * @param tokenRng 数字圆片随机数生成器
 * @returns Hex[] 六边形数组
 */
function generateHexes(
  hexCoords: {q: number, r: number}[],
  terrainRng: Random,
  tokenRng: Random
): Hex[] {
  const shuffledResources = terrainRng.shuffle(RESOURCE_TILES);
  const shuffledTokens = tokenRng.shuffle(NUMBER_TOKENS);
  
  let resIdx = 0;
  let tokenIdx = 0;
  const hexes: Hex[] = [];

  hexCoords.forEach(coord => {
    const isCenter = coord.q === 0 && coord.r === 0;
    // 中心位置固定为沙漠，其他位置随机分配资源地形
    const terrain = isCenter ? TerrainType.DESERT : shuffledResources[resIdx++];
    // 沙漠没有数字圆片，其他地形随机分配
    const token = isCenter ? null : shuffledTokens[tokenIdx++];
    
    hexes.push({
      id: `h_${coord.q}_${coord.r}`,
      q: coord.q, r: coord.r, s: -coord.q - coord.r,
      terrain,
      numberToken: token,
      hasRobber: isCenter // 强盗初始位置在沙漠
    });
  });

  return hexes;
}

/**
 * 生成顶点和边数据
 * @param hexes 六边形数组
 * @returns {vertices: Vertex[], edges: Edge[], edgeToHexMap: Map<string, string[]>}
 */
function generateVerticesAndEdges(hexes: Hex[]): {
  vertices: Vertex[];
  edges: Edge[];
  edgeToHexMap: Map<string, string[]>;
} {
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];
  // 顶点去重映射表（相邻六边形共享顶点）
  const vertexMap = new Map<string, Vertex>();
  // 边去重映射表和边到六边形的关系映射
  const edgeMap = new Map<string, Edge>();
  const edgeToHexMap = new Map<string, string[]>();

  /**
   * 获取或创建顶点
   * 使用坐标作为key确保相同位置的顶点不会重复创建
   */
  const getVertex = (vx: number, vy: number) => {
    const key = `${vx.toFixed(2)},${vy.toFixed(2)}`;
    if (!vertexMap.has(key)) {
      const v = { id: `v_${key}`, x: vx, y: vy, building: null, portId: null };
      vertexMap.set(key, v);
      vertices.push(v);
    }
    return vertexMap.get(key)!;
  };

  // 为每个六边形生成6个顶点和6条边
  hexes.forEach(hex => {
    const center = hexToPixel(hex.q, hex.r);
    const hexVIds: string[] = [];
    
    // 生成六边形的6个顶点（从右上角开始，逆时针）
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const vx = center.x + HEX_SIZE * Math.cos(angle);
      const vy = center.y + HEX_SIZE * Math.sin(angle);
      hexVIds.push(getVertex(vx, vy).id);
    }

    // 生成六边形的6条边（连接相邻顶点）
    for (let i = 0; i < 6; i++) {
      const v1Id = hexVIds[i];
      const v2Id = hexVIds[(i + 1) % 6];
      // 边的ID由两个顶点ID排序后组成，确保相同的边只创建一次
      const eId = [v1Id, v2Id].sort().join('_');
      
      if (!edgeMap.has(eId)) {
        const edge = { id: eId, vertexIds: [v1Id, v2Id] as [string, string], road: null };
        edgeMap.set(eId, edge);
        edges.push(edge);
      }
      
      // 记录这条边属于哪些六边形（用于后续判断海岸线）
      const hexList = edgeToHexMap.get(eId) || [];
      hexList.push(hex.id);
      edgeToHexMap.set(eId, hexList);
    }
  });

  return { vertices, edges, edgeToHexMap };
}

/**
 * 识别海岸线边（修复版：精准筛选+正确排序）
 * @param edges 所有边数组
 * @param edgeToHexMap 边到六边形的映射表
 * @param vertices 所有顶点数组
 * @returns 按顺时针排序的纯海岸线边数组
 */
function identifyCoastalEdges(
  edges: Edge[],
  edgeToHexMap: Map<string, string[]>,
  vertices: Vertex[]
): Edge[] {
  // 第一步：精准筛选海岸线边（仅属于1个六边形的边）
  const coastalEdges = edges.filter(edge => {
    const hexList = edgeToHexMap.get(edge.id) || [];
    // 严格校验：只有属于1个六边形的边才是海岸线边
    return hexList.length === 1;
  });

  // 第二步：按顺时针方向排序（以地图中心为基准）
  return coastalEdges.sort((edgeA, edgeB) => {
    // 辅助函数：获取边的中点坐标（精准版）
    const getEdgeMidpoint = (edge: Edge) => {
      // 精准查找顶点，避免空值
      const v1 = vertices.find(v => v.id === edge.vertexIds[0]);
      const v2 = vertices.find(v => v.id === edge.vertexIds[1]);
      if (!v1 || !v2) {
        return { x: 0, y: 0 }; // 兜底，避免排序异常
      }
      return {
        x: (v1.x + v2.x) / 2,
        y: (v1.y + v2.y) / 2
      };
    };

    // 计算两个边中点相对于地图中心（0,0）的角度
    const midA = getEdgeMidpoint(edgeA);
    const midB = getEdgeMidpoint(edgeB);
    
    // 修正角度计算：Math.atan2(y, x) 是正确的极角计算方式
    const angleA = Math.atan2(midA.y, midA.x);
    const angleB = Math.atan2(midB.y, midB.x);

    // 按角度从小到大排序（顺时针）
    return angleA - angleB;
  });
}

/**
 * 生成港口数据
 * @param coastalEdges 按顺时针排序的海岸线边数组
 * @param edgeToHexMap 边到六边形的映射表
 * @param hexes 六边形数组
 * @param vertices 顶点数组
 * @returns Port[] 港口数组
 */
function generatePorts(
  coastalEdges: Edge[],
  edgeToHexMap: Map<string, string[]>,
  hexes: Hex[],
  vertices: Vertex[],
  portCount: number
): Port[] {
  // 根据 portCount 生成港口配置
  const portConfigs: {type: 'ANY' | ResourceType, ratio: number}[] = [];
  for (let i = 0; i < portCount; i++) {
    portConfigs.push(STANDARD_PORT_CONFIGS[i % STANDARD_PORT_CONFIGS.length]);
  }
  
  const ports: Port[] = [];
  const totalCoastalEdges = coastalEdges.length;
  const totalPorts = portConfigs.length;
  
  console.log(`[MapGenerator] 海岸线边数量: ${totalCoastalEdges}, 港口数量: ${totalPorts}`);
  
  // 修复：均匀分布港口的算法（更精确的间隔计算）
  let successfulPorts = 0;
  let attemptIndex = 0;
  
  while (successfulPorts < totalPorts && attemptIndex < totalCoastalEdges * 2) {
    // 计算港口位置索引，确保均匀分布
    const edgeIndex = Math.floor((attemptIndex * totalCoastalEdges) / totalPorts) % totalCoastalEdges;
    const edge = coastalEdges[edgeIndex];
    const config = portConfigs[successfulPorts];
    const pId = `p_${successfulPorts}`;
    
    attemptIndex++;
    
    // 验证1：这条边必须只属于1个六边形（海岸线边）
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
    
    // 验证2：六边形必须在地图边缘（半径为2的地图，边缘六边形满足 |q|==2 || |r|==2 || |s|==2）
    const isEdgeHex = Math.abs(ownerHex.q) === 2 || Math.abs(ownerHex.r) === 2 || Math.abs(ownerHex.s) === 2;
    if (!isEdgeHex) {
      console.warn(`[MapGenerator] 六边形 ${ownerHexId} (q=${ownerHex.q}, r=${ownerHex.r}, s=${ownerHex.s}) 不在地图边缘，跳过`);
      continue;
    }
    
    // 获取六边形中心像素坐标
    const hexPos = hexToPixel(ownerHex.q, ownerHex.r);
    
    // 获取边的两个顶点
    const v1 = vertices.find(v => v.id === edge.vertexIds[0])!;
    const v2 = vertices.find(v => v.id === edge.vertexIds[1])!;
    
    // 计算边中点坐标
    const edgeMidX = (v1.x + v2.x) / 2;
    const edgeMidY = (v1.y + v2.y) / 2;
    
    // 验证3：边中点到地图中心的距离应该大于六边形中心到地图中心的距离
    const edgeDistToCenter = Math.sqrt(edgeMidX * edgeMidX + edgeMidY * edgeMidY);
    const hexDistToCenter = Math.sqrt(hexPos.x * hexPos.x + hexPos.y * hexPos.y);
    
    if (edgeDistToCenter <= hexDistToCenter * 1.05) { // 增加5%的容差
      console.warn(`[MapGenerator] 边 ${edge.id} 不够外围 (边距离=${edgeDistToCenter.toFixed(1)}, 六边形距离=${hexDistToCenter.toFixed(1)})，跳过`);
      continue;
    }
    
    // 验证4：边的两个顶点到地图中心的距离都应该足够大（在外围）
    const v1DistToCenter = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const v2DistToCenter = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const minVertexDist = Math.min(v1DistToCenter, v2DistToCenter);
    
    // 外围顶点的距离应该大于 HEX_SIZE * 2（至少2个六边形的距离）
    if (minVertexDist < HEX_SIZE * 1.8) {
      console.warn(`[MapGenerator] 边 ${edge.id} 的顶点不够外围 (v1=${v1DistToCenter.toFixed(1)}, v2=${v2DistToCenter.toFixed(1)})，跳过`);
      continue;
    }
    
    // 计算港口朝外方向向量（从六边形中心指向边中点）
    const dx = edgeMidX - hexPos.x;
    const dy = edgeMidY - hexPos.y;
    const mag = Math.sqrt(dx*dx + dy*dy) || 1; // 防止除以0
    const outwardVector = { x: dx / mag, y: dy / mag };
    
    console.log(`[MapGenerator] ✓ 港口 ${successfulPorts} 验证通过: hex(${ownerHex.q},${ownerHex.r},${ownerHex.s}) edge(${edge.id}) 边距离=${edgeDistToCenter.toFixed(1)} > 六边形距离=${hexDistToCenter.toFixed(1)}, 顶点距离=(${v1DistToCenter.toFixed(1)}, ${v2DistToCenter.toFixed(1)})`);
    
    // 创建港口对象
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

  return ports;
}

/**
 * 生成卡坦岛地图
 * @param terrainSeed 地形随机种子
 * @param tokenSeed 数字圆片随机种子
 * @returns 包含六边形、顶点、边和港口的完整地图数据
 */
export function generateMap(terrainSeed: string, tokenSeed: string, portCount: number = 9): {
  hexes: Hex[];
  vertices: Vertex[];
  edges: Edge[];
  ports: Port[];
} {
  // 创建两个独立的随机数生成器，分别用于地形和数字圆片
  const terrainRng = new Random(terrainSeed);
  const tokenRng = new Random(tokenSeed);

  // 1. 生成六边形坐标
  const hexCoords = generateHexCoordinates();
  
  // 2. 生成六边形数据（地形+数字）
  const hexes = generateHexes(hexCoords, terrainRng, tokenRng);
  
  // 3. 生成顶点和边数据
  const { vertices, edges, edgeToHexMap } = generateVerticesAndEdges(hexes);
  
  // 4. 识别海岸线边
  const coastalEdges = identifyCoastalEdges(edges, edgeToHexMap, vertices);
  
  // 5. 生成港口数据
  const ports = generatePorts(coastalEdges, edgeToHexMap, hexes, vertices, portCount);

  return { hexes, vertices, edges, ports };
}