import React from 'react';
import { GameState, GamePhase, BuildingType, ResourceType, Port } from '../../types';
import { HEX_SIZE, RESOURCE_COLORS, RESOURCE_NAMES } from '../../constants';
import { HexTile } from './HexTile';
import { gameService } from '../../services/gameService';
import { Sailboat } from 'lucide-react';

interface Props {
  gameState: GameState;
  onBuildRoad: (edgeId: string) => void;
  onBuildSettlement: (vertexId: string) => void;
  onMoveRobber: (hexId: string) => void;
  onPortClick: (port: Port) => void;
  onRemoveRoad: (edgeId: string) => void;
  onRemoveBuilding: (vertexId: string) => void;
}

function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

export const CatanMap: React.FC<Props> = ({ gameState, onBuildRoad, onBuildSettlement, onMoveRobber, onPortClick, onRemoveRoad, onRemoveBuilding }) => {
  const { map, players, phase, currentPlayerId } = gameState;
  const offsetX = 400;
  const offsetY = 300;

  const myPlayerId = gameService.getPlayerId();
  const isMyTurn = currentPlayerId === myPlayerId;
  const player = players.find(p => p.id === myPlayerId);
  
  if (!player) return null;
  
  const isMapBuilding = phase === GamePhase.MAP_BUILDING;
  const isSetup = phase === GamePhase.SETUP;
  const isRoadBuilding = gameState.devCardAction?.type === 'ROAD_BUILDING' && gameState.devCardAction.playerId === myPlayerId;
  const canAffordSettlement = isSetup || (player.resources.WOOD >= 1 && player.resources.BRICK >= 1 && player.resources.SHEEP >= 1 && player.resources.WHEAT >= 1);
  const canAffordRoad = isSetup || isRoadBuilding || (player.resources.WOOD >= 1 && player.resources.BRICK >= 1);

  // 初始放置阶段：所有玩家都可以放置（只要没超过限制）
  // 正常阶段：只有当前玩家可以放置
  // 地图构建阶段：不允许放置
  const canPlaceInSetup = !isMapBuilding && isSetup && player.setupSettlements < 2;
  const canPlaceRoadInSetup = !isMapBuilding && isSetup && player.setupRoads < 2;
  
  const showSettlementHighlights = canPlaceInSetup || (!isMapBuilding && isMyTurn && phase === GamePhase.MAIN_TURN && canAffordSettlement);
  const showRoadHighlights = canPlaceRoadInSetup || (!isMapBuilding && isRoadBuilding) || (!isMapBuilding && isMyTurn && phase === GamePhase.MAIN_TURN && canAffordRoad);
  const isRobberMode = phase === GamePhase.ROBBER_PLACEMENT;

  // 调试日志
  console.log('[CatanMap] 渲染状态:', {
    phase,
    isSetup,
    isMyTurn,
    currentPlayerId,
    myPlayerId,
    canPlaceInSetup,
    canPlaceRoadInSetup,
    showSettlementHighlights,
    showRoadHighlights,
    setupSettlements: player.setupSettlements,
    setupRoads: player.setupRoads,
    isRoadBuilding,
    devCardAction: gameState.devCardAction
  });

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 overflow-hidden relative shadow-inner rounded-xl border-4 border-slate-700">
      <svg width="100%" height="100%" viewBox="0 0 800 600" className="select-none">
        <defs>
          {/* 海洋渐变 */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="1" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="1" />
          </radialGradient>
          
          {/* 海洋纹理图案 */}
          <pattern id="oceanPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* 波浪线 */}
            <path d="M 0 30 Q 25 20 50 30 Q 75 40 100 30" stroke="#0ea5e9" strokeWidth="1" fill="none" opacity="0.2" />
            <path d="M 0 60 Q 25 50 50 60 Q 75 70 100 60" stroke="#0ea5e9" strokeWidth="1" fill="none" opacity="0.2" />
            <path d="M 0 90 Q 25 80 50 90 Q 75 100 100 90" stroke="#0ea5e9" strokeWidth="1" fill="none" opacity="0.2" />
            {/* 小气泡 */}
            <circle cx="20" cy="45" r="1.5" fill="#38bdf8" opacity="0.3" />
            <circle cx="70" cy="75" r="1" fill="#38bdf8" opacity="0.3" />
            <circle cx="40" cy="15" r="1" fill="#38bdf8" opacity="0.3" />
          </pattern>
          
          {/* 海洋图片图案（如果有图片） */}
          <pattern id="oceanImagePattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
  <rect x="0" y="0" width="200" height="200" fill="#0a3d62" />
</pattern>
        </defs>
        
        {/* 海洋背景层 */}
        <rect width="800" height="600" fill="url(#oceanGrad)" />
        <rect width="800" height="600" fill="url(#oceanImagePattern)" opacity="0.6" />
        <rect width="800" height="600" fill="url(#oceanPattern)" />

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {map.hexes.map((hex) => {
            const pos = hexToPixel(hex.q, hex.r);
            return (
              <HexTile 
                key={hex.id} hex={hex} x={pos.x} y={pos.y} 
                isRobberMode={isRobberMode}
                onRobberClick={() => onMoveRobber(hex.id)}
              />
            );
          })}
        </g>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {map.ports.map(port => {
            const v1 = map.vertices.find(v => v.id === port.vertexIds[0])!;
            const v2 = map.vertices.find(v => v.id === port.vertexIds[1])!;
            const midX = (v1.x + v2.x) / 2;
            const midY = (v1.y + v2.y) / 2;
            const portX = midX + port.outwardVector.x * 55;
            const portY = midY + port.outwardVector.y * 55;
            
            // 调试：输出港口位置信息

            // 检查是否占领港口：两个顶点中至少有一个有自己的建筑
            const isOwnedByMe = port.vertexIds.some(vId => {
              const v = map.vertices.find(vx => vx.id === vId);
              return v?.building?.ownerId === myPlayerId;
            });

            // 只有在自己回合且占领港口时才能点击
            const canTrade = isOwnedByMe && isMyTurn && phase === GamePhase.MAIN_TURN;

            return (
              <g 
                key={port.id} 
                onClick={() => canTrade ? onPortClick(port) : null} 
                className={canTrade ? 'cursor-pointer group' : ''}
              >
                <line x1={v1.x} y1={v1.y} x2={portX} y2={portY} stroke="#0ea5e9" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
                <line x1={v2.x} y1={v2.y} x2={portX} y2={portY} stroke="#0ea5e9" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
                
                <g transform={`translate(${portX}, ${portY})`}>
                  {/* 背景 - 简洁的圆形 */}
                  <circle 
                    r="40" 
                    fill="#0c4a6e" 
                    stroke={isOwnedByMe ? "#fbbf24" : "#0ea5e9"} 
                    strokeWidth={isOwnedByMe ? "4" : "3"} 
                    style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }} 
                    className={canTrade ? 'group-hover:stroke-amber-300 transition-colors' : ''}
                  />
                  
                  {/* 内圈装饰 */}
                  <circle 
                    r="36" 
                    fill="none" 
                    stroke="#0ea5e9" 
                    strokeWidth="1" 
                    opacity="0.3"
                  />
                  
                  {/* 可交易时的高亮效果 */}
                  {canTrade && (
                    <circle 
                      r="43" 
                      fill="none" 
                      stroke="#fbbf24" 
                      strokeWidth="3" 
                      opacity="0.7"
                      className="animate-pulse-highlight"
                    />
                  )}
                  
                  {/* 帆船图标 */}
                  <g transform="translate(0, -15)">
                    {/* 船帆 */}
                    <path 
                      d="M 0,-12 L -10,8 L 0,6 Z" 
                      fill="#38bdf8" 
                      stroke="#0ea5e9" 
                      strokeWidth="1.5"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                    />
                    <path 
                      d="M 0,-12 L 10,8 L 0,6 Z" 
                      fill="#7dd3fc" 
                      stroke="#0ea5e9" 
                      strokeWidth="1.5"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                    />
                    {/* 桅杆 */}
                    <line 
                      x1="0" y1="-12" 
                      x2="0" y2="10" 
                      stroke="#94a3b8" 
                      strokeWidth="2"
                    />
                    {/* 船体 */}
                    <path 
                      d="M -12,10 L -8,14 L 8,14 L 12,10 Z" 
                      fill="#64748b" 
                      stroke="#475569" 
                      strokeWidth="1.5"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                    />
                  </g>
                  
                  {/* 资源文字或交易比例 */}
                  {port.type !== 'ANY' ? (
                    // 特殊资源港口：显示资源名称
                    <>
                      {/* 资源名称 */}
                      <text 
                        textAnchor="middle" 
                        y="12" 
                        fontSize="13" 
                        fontWeight="900" 
                        fill={RESOURCE_COLORS[port.type as ResourceType]}
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)',
                          stroke: '#000',
                          strokeWidth: '1px',
                          paintOrder: 'stroke'
                        }}
                      >
                        {RESOURCE_NAMES[port.type as ResourceType]}
                      </text>
                      {/* 2:1 标签 */}
                      <text 
                        textAnchor="middle" 
                        y="28" 
                        fontSize="11" 
                        fontWeight="900" 
                        fill="#fbbf24"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                          stroke: '#000',
                          strokeWidth: '0.5px',
                          paintOrder: 'stroke'
                        }}
                      >
                        2:1
                      </text>
                    </>
                  ) : (
                    // 通用港口：显示 "通用" + "3:1"
                    <>
                      <text 
                        textAnchor="middle" 
                        y="12" 
                        fontSize="13" 
                        fontWeight="900" 
                        fill="#ffffff"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                          stroke: '#000',
                          strokeWidth: '1px',
                          paintOrder: 'stroke'
                        }}
                      >
                        通用
                      </text>
                      <text 
                        textAnchor="middle" 
                        y="28" 
                        fontSize="11" 
                        fontWeight="900" 
                        fill="#fbbf24"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                          stroke: '#000',
                          strokeWidth: '0.5px',
                          paintOrder: 'stroke'
                        }}
                      >
                        3:1
                      </text>
                    </>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {map.edges.map(edge => {
            const v1 = map.vertices.find(v => v.id === edge.vertexIds[0])!;
            const v2 = map.vertices.find(v => v.id === edge.vertexIds[1])!;
            const roadOwner = players.find(p => p.id === edge.road?.ownerId);
            const isValidSpot = showRoadHighlights && gameService.canBuildRoadAt(edge.id, myPlayerId);
            const isMyRoad = edge.road?.ownerId === myPlayerId;
            const canRemove = isSetup && isMyRoad && !player.setupLocked;

            const handleRoadClick = () => {
              if (canRemove) {
                onRemoveRoad(edge.id);
              } else if (isValidSpot) {
                onBuildRoad(edge.id);
              }
            };

            return (
              <g key={edge.id} onClick={handleRoadClick} className={`group ${(isValidSpot || canRemove) ? 'cursor-pointer' : ''}`}>
                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="transparent" strokeWidth="18" />
                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={roadOwner?.color || 'transparent'} strokeWidth="9" strokeLinecap="round" />
                {isValidSpot && <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#fbbf24" strokeWidth="4" strokeDasharray="10,5" className="animate-pulse-highlight" />}
                {canRemove && <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#ef4444" strokeWidth="3" strokeDasharray="5,5" className="opacity-60 group-hover:opacity-100" />}
              </g>
            );
          })}
        </g>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {map.vertices.map(vertex => {
             const building = vertex.building;
             const owner = building ? players.find(p => p.id === building.ownerId) : null;
             const isValidSpot = showSettlementHighlights && gameService.canBuildSettlementAt(vertex.id, myPlayerId);
             const isMyBuilding = building?.ownerId === myPlayerId;
             const canRemove = isSetup && isMyBuilding && !player.setupLocked;
             const canUpgrade = !isSetup && isMyBuilding && building?.type === BuildingType.SETTLEMENT;
             
             const handleVertexClick = () => {
               if (canRemove) {
                 onRemoveBuilding(vertex.id);
               } else if (isValidSpot || canUpgrade) {
                 onBuildSettlement(vertex.id);
               }
             };
             
             return (
               <g key={vertex.id} transform={`translate(${vertex.x}, ${vertex.y})`} onClick={handleVertexClick} className={`group ${(isValidSpot || canRemove || canUpgrade) ? 'cursor-pointer' : ''}`}>
                 <circle r="18" fill="transparent" />
                 {building ? (
                    <>
                      {building.type === BuildingType.SETTLEMENT ? (
                          <path d="M -11 9 L -11 -2 L 0 -13 L 11 -2 L 11 9 Z" fill={owner?.color} stroke="#f8fafc" strokeWidth="2.5" />
                      ) : (
                          <path d="M -13 11 L -13 0 L -7 -6 L 0 0 L 7 -6 L 13 0 L 13 11 Z" fill={owner?.color} stroke="#f8fafc" strokeWidth="2.5" />
                      )}
                      {canRemove && (
                        <circle r="12" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" className="opacity-60 group-hover:opacity-100" />
                      )}
                    </>
                 ) : (
                    isValidSpot && <circle r="9" fill="#fbbf24" stroke="#020617" strokeWidth="2.5" className="animate-pulse-highlight" />
                 )}
               </g>
             )
          })}
        </g>
      </svg>
      {/* 强盗偷窃阶段的选择界面 */}
      {phase === GamePhase.ROBBER_STEAL && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 shadow-2xl pointer-events-auto space-y-6 text-center animate-in zoom-in duration-300">
                  <h3 className="text-xl font-black text-white">选择偷取的对象</h3>
                  <div className="flex gap-4 justify-center">
                      {/* 显示所有可以偷取的玩家 */}
                      {gameState.stealingFrom.map(vId => {
                          const vPlayer = players.find(p => p.id === vId);
                          return (
                              <button 
                                  key={vId} 
                                  onClick={() => gameService.stealFrom(vId)} 
                                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all hover:scale-105 active:scale-95"
                              >
                                  <div 
                                      className="w-12 h-12 rounded-full border-2 border-white/20" 
                                      style={{ backgroundColor: vPlayer?.color }}
                                  ></div>
                                  <span className="font-bold text-white">{vPlayer?.name}</span>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
