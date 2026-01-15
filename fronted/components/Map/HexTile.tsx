
import React from 'react';
import { Hex, TerrainType } from '../../types';
import { TERRAIN_CONFIG, HEX_SIZE } from '../../constants';

interface Props {
  hex: Hex;
  x: number;
  y: number;
  onRobberClick?: () => void;
  isRobberMode?: boolean;
}

// 地形图片路径映射
// 将图片文件放入 fronted/public/assets/terrains/ 文件夹
const TERRAIN_IMAGES: Record<TerrainType, string> = {
  [TerrainType.FOREST]: '/assets/terrains/forest.png',      // 森林 🌲 - 产出木材 (WOOD) - 深绿色
  [TerrainType.HILLS]: '/assets/terrains/hills.png',        // 丘陵 🧱 - 产出砖块 (BRICK) - 红褐色
  [TerrainType.PASTURE]: '/assets/terrains/pasture.png',    // 草原 🐑 - 产出羊毛 (SHEEP) - 浅绿色
  [TerrainType.FIELDS]: '/assets/terrains/fields.png',      // 田野 🌾 - 产出粮食 (WHEAT) - 金黄色
  [TerrainType.MOUNTAINS]: '/assets/terrains/mountains.png',// 山地 ⛰️ - 产出矿石 (ORE) - 灰色
  [TerrainType.DESERT]: '/assets/terrains/desert.png',      // 沙漠 🏜️ - 无产出 - 黄褐色
};

/**
 * 六边形地形板块组件
 * 显示内容：
 * - 地形颜色和类型（带纹理图案）
 * - 数字圆片（沙漠除外）
 * - 强盗标记
 * - 强盗移动模式下的交互高亮
 */
export const HexTile: React.FC<Props> = ({ hex, x, y, onRobberClick, isRobberMode }) => {
  // 获取地形配置（颜色、资源类型、名称）
  const config = (hex && hex.terrain && TERRAIN_CONFIG[hex.terrain]) 
    ? TERRAIN_CONFIG[hex.terrain] 
    : { color: '#334155', resource: null, name: '未知' };
  
  // 计算六边形的6个顶点坐标（平顶六边形）
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // 从-30度开始，每60度一个顶点
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${x + HEX_SIZE * Math.cos(angle_rad)},${y + HEX_SIZE * Math.sin(angle_rad)}`);
  }
  const hexPolygonPoints = points.join(' ');

  const isDesert = hex.terrain === TerrainType.DESERT;
  
  // 为每个六边形生成唯一的图案ID
  const patternId = `pattern-${hex.id}`;
  const gradientId = `gradient-${hex.id}`;
  const clipPathId = `clip-${hex.id}`;
  
  // 获取地形图片路径
  const terrainImage = TERRAIN_IMAGES[hex.terrain];

  return (
    <g 
      className={`transition-all duration-500 ${isRobberMode && !hex.hasRobber ? 'cursor-pointer hover:filter hover:brightness-125' : ''}`}
      onClick={isRobberMode && !hex.hasRobber ? onRobberClick : undefined}
    >
      {/* 定义地形纹理图案 */}
      <defs>
        {/* 六边形裁剪路径 - 用于裁剪图片 */}
        <clipPath id={clipPathId}>
          <polygon points={hexPolygonPoints} />
        </clipPath>
        
        {/* 渐变背景（作为图片加载失败时的后备） */}
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={config.color} stopOpacity="1" />
          <stop offset="100%" stopColor={config.color} stopOpacity="0.7" />
        </radialGradient>
        
        {/* SVG 纹理图案（作为后备，如果图片不存在则显示这些图案） */}
        <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          {hex.terrain === TerrainType.FOREST && (
            // 森林 🌲：树木圆点图案 - 产出木材
            <>
              <circle cx="5" cy="5" r="2" fill="#1e3a1e" opacity="0.4" />
              <circle cx="15" cy="15" r="2" fill="#1e3a1e" opacity="0.4" />
              <circle cx="10" cy="12" r="1.5" fill="#2d5a2d" opacity="0.3" />
            </>
          )}
          {hex.terrain === TerrainType.HILLS && (
            // 丘陵 🧱：砖块堆叠图案 - 产出砖块
            <>
              <rect x="0" y="0" width="10" height="5" fill="#7c2d12" opacity="0.2" />
              <rect x="10" y="5" width="10" height="5" fill="#7c2d12" opacity="0.2" />
              <rect x="0" y="10" width="10" height="5" fill="#7c2d12" opacity="0.2" />
              <rect x="10" y="15" width="10" height="5" fill="#7c2d12" opacity="0.2" />
            </>
          )}
          {hex.terrain === TerrainType.PASTURE && (
            // 草原 🐑：草地线条图案 - 产出羊毛
            <>
              <line x1="2" y1="8" x2="2" y2="12" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
              <line x1="6" y1="6" x2="6" y2="10" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
              <line x1="10" y1="9" x2="10" y2="13" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
              <line x1="14" y1="7" x2="14" y2="11" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
              <line x1="18" y1="10" x2="18" y2="14" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
            </>
          )}
          {hex.terrain === TerrainType.FIELDS && (
            // 田野 🌾：麦穗图案 - 产出粮食
            <>
              <line x1="3" y1="3" x2="7" y2="7" stroke="#854d0e" strokeWidth="1" opacity="0.3" />
              <line x1="13" y1="13" x2="17" y2="17" stroke="#854d0e" strokeWidth="1" opacity="0.3" />
              <circle cx="5" cy="5" r="1" fill="#a16207" opacity="0.4" />
              <circle cx="15" cy="15" r="1" fill="#a16207" opacity="0.4" />
            </>
          )}
          {hex.terrain === TerrainType.MOUNTAINS && (
            // 山地 ⛰️：岩石三角形图案 - 产出矿石
            <>
              <polygon points="5,10 8,5 11,10" fill="#1e293b" opacity="0.3" />
              <polygon points="15,15 18,10 20,15" fill="#1e293b" opacity="0.3" />
              <circle cx="3" cy="17" r="1.5" fill="#334155" opacity="0.4" />
            </>
          )}
          {hex.terrain === TerrainType.DESERT && (
            // 沙漠 🏜️：沙丘波浪图案 - 无产出
            <>
              <path d="M 0 10 Q 5 5 10 10 Q 15 15 20 10" stroke="#92400e" strokeWidth="0.5" fill="none" opacity="0.3" />
              <circle cx="7" cy="13" r="0.8" fill="#78350f" opacity="0.3" />
              <circle cx="14" cy="7" r="0.8" fill="#78350f" opacity="0.3" />
            </>
          )}
        </pattern>
      </defs>
      
      {/* 基础六边形板块 - 使用渐变作为后备背景 */}
      <polygon
        points={hexPolygonPoints}
        fill={`url(#${gradientId})`}
        stroke="#0f172a"
        strokeWidth="3"
      />
      
      {/* 图片填充层 - 使用 clipPath 裁剪成六边形 */}
      <g clipPath={`url(#${clipPathId})`}>
        <image 
          href={terrainImage}
          x={x - HEX_SIZE * 1.2}
          y={y - HEX_SIZE * 1.2}
          width={HEX_SIZE * 2.4}
          height={HEX_SIZE * 2.4}
          preserveAspectRatio="xMidYMid slice"
          opacity="0.9"
        />
      </g>
      
      {/* SVG 纹理图案覆盖层（半透明，增强细节） */}
      <polygon
        points={hexPolygonPoints}
        fill={`url(#${patternId})`}
        opacity="0.2"
        pointerEvents="none"
      />
      
      {/* 六边形边框 */}
      <polygon
        points={hexPolygonPoints}
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
        pointerEvents="none"
      />
      
      {/* 
        数字圆片（资源产出标记）
        规则：
        - 沙漠不显示数字
        - 被强盗占据时不显示数字
        - 6和8用红色标记（最高概率）
        - 下方显示概率权重圆点
      */}
      {!isDesert && !hex.hasRobber && hex.numberToken !== null && (
        <g transform={`translate(${x}, ${y})`}>
          {/* 圆盘背景 */}
          <circle r="20" fill="#fefce8" stroke="#92400e" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
          
          {/* 数字 */}
          <text
            textAnchor="middle"
            dy=".35em"
            className={`text-base font-black select-none ${
              hex.numberToken === 6 || hex.numberToken === 8 ? 'fill-rose-600' : 'fill-slate-900'
            }`}
          >
            {hex.numberToken}
          </text>
          
          {/* 
            概率权重圆点
            计算公式：6 - |7 - 数字| 
            例如：6和8有5个点（最高概率），2和12有1个点（最低概率）
          */}
          <g transform="translate(0, 13)">
              {Array.from({length: 6 - Math.abs(7 - hex.numberToken)}).map((_, i, arr) => {
                  const spacing = 4.5;
                  const startX = -(arr.length - 1) * spacing / 2;
                  return (
                      <circle 
                        key={i} 
                        cx={startX + i * spacing} 
                        cy="0" 
                        r="1.6" 
                        fill={hex.numberToken === 6 || hex.numberToken === 8 ? '#e11d48' : '#475569'} 
                      />
                  );
              })}
          </g>
        </g>
      )}

      {/* 
        强盗标记
        效果：
        - 覆盖数字圆片
        - 该板块停止产出资源
        - 显示"ROBBER"文字
      */}
      {hex.hasRobber && (
         <g transform={`translate(${x}, ${y})`}>
            {/* 强盗背景圆圈（带金色虚线边框） */}
            <circle r="22" fill="rgba(15,23,42,0.85)" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="5,2" />
            
            {/* 强盗图标（简化的人形） */}
            <path d="M -9 10 L 9 10 L 0 -14 Z" fill="#020617" />
            <circle r="6" cy="-14" fill="#020617" />
            
            {/* 强盗文字标签 */}
            <text textAnchor="middle" dy="2.4em" fill="#f8fafc" fontSize="8" fontWeight="900" className="uppercase tracking-widest drop-shadow-lg">ROBBER</text>
         </g>
      )}
    </g>
  );
};
