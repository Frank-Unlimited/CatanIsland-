
import React, { useState } from 'react';
import { GamePhase, GameState, ResourceType, Player, DevCardType, Port } from '../../types';
import { RESOURCE_COLORS, RESOURCE_NAMES, DEV_CARD_DESCRIPTIONS } from '../../constants';
import { Dices, Wrench, LayoutGrid, Settings2, CreditCard, Users, Trophy, Ship, HandMetal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { gameService } from '../../services/gameService';
import { ResourceCard } from './ResourceCard';
import { DevelopmentCard } from './DevelopmentCard';

interface Props {
  gameState: GameState;
  playerId: string;
  onRollDice: () => void;
  onEndTurn: () => void;
  portOverride?: Port | null;
  clearPortOverride: () => void;
}

type Tab = 'main' | 'trade' | 'cards' | 'players';

export const ActionPanel: React.FC<Props> = ({ gameState, playerId, onRollDice, onEndTurn, portOverride, clearPortOverride }) => {
  const { phase, dice, currentPlayerId, players, debugMode, terrainSeed, tokenSeed } = gameState;
  const isMyTurn = currentPlayerId === playerId;
  const player = players.find(p => p.id === playerId);
  
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [tradeMode, setTradeMode] = useState<'bank' | 'player'>('bank');
  
  // 银行交易状态（任意4个换1个）
  const [bankGive, setBankGive] = useState<Partial<Record<ResourceType, number>>>({});
  const [bankGet, setBankGet] = useState<ResourceType>(ResourceType.WOOD);

  // 种子输入状态
  const [inputTerrainSeed, setInputTerrainSeed] = useState(terrainSeed || '');
  const [inputTokenSeed, setInputTokenSeed] = useState(tokenSeed || '');
  const [inputPortCount, setInputPortCount] = useState(gameState.portCount || 9);

  // 当游戏状态的种子改变时，更新输入框
  React.useEffect(() => {
    if (terrainSeed) setInputTerrainSeed(terrainSeed);
    if (tokenSeed) setInputTokenSeed(tokenSeed);
    if (gameState.portCount) setInputPortCount(gameState.portCount);
  }, [terrainSeed, tokenSeed, gameState.portCount]);

  // 玩家交易状态
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [playerOffer, setPlayerOffer] = useState<Partial<Record<ResourceType, number>>>({});
  const [playerRequest, setPlayerRequest] = useState<Partial<Record<ResourceType, number>>>({});

  // 当点击港口时，自动切换到交易标签页
  React.useEffect(() => {
    if (portOverride) {
      setActiveTab('trade');
      setTradeMode('bank');
    }
  }, [portOverride]);

  if (!player) return null;

  const isMapBuilding = phase === GamePhase.MAP_BUILDING;
  const isSetup = phase === GamePhase.SETUP;
  const setupFinished = player.setupSettlements >= 2 && player.setupRoads >= 2;
  const resourceOptions = (Object.keys(RESOURCE_NAMES) as ResourceType[]).filter(r => r !== ResourceType.DESERT);

  // 计算银行交易给出的资源总数
  const totalBankGive: number = (Object.values(bankGive) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0);
  const canBankTrade: boolean = totalBankGive >= 4;
  const bankGetAmount: number = Math.floor(totalBankGive / 4);

  // 处理银行交易
  const handleBankTrade = () => {
    if (!canBankTrade) return;
    gameService.tradeWithBank(bankGive, bankGet);
    setBankGive({});
  };

  // 处理玩家交易提案
  const handleProposeTrade = () => {
    if (!selectedPlayer) {
      alert('请选择交易对象');
      return;
    }
    
    // 检查是否至少有一个出价或需求
    const hasOffer = Object.values(playerOffer).some((v: number | undefined) => v && v > 0);
    const hasRequest = Object.values(playerRequest).some((v: number | undefined) => v && v > 0);
    
    if (!hasOffer && !hasRequest) {
      alert('请设置出价或需求');
      return;
    }
    
    gameService.proposePlayerTrade(selectedPlayer, playerOffer, playerRequest);
  };

  // 检查是否有待处理的交易提案
  const tradeOffer = gameState.tradeOffer;
  const pendingTradeForMe = tradeOffer && tradeOffer.toPlayerId === playerId;
  const myTradeOffer = tradeOffer && tradeOffer.fromPlayerId === playerId;
  
  // 获取其他玩家列表（排除自己）
  const otherPlayers = players.filter(p => p.id !== playerId);

  const handlePlayerTrade = () => {
    gameService.tradeWithPlayer('p2', playerOffer, playerRequest);
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 p-0 flex flex-col shadow-2xl z-10 overflow-y-auto">
      {/* 交易提案通知 */}
      {pendingTradeForMe && tradeOffer && (
        <div className="bg-amber-500/20 border-b-2 border-amber-500 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HandMetal size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-500">收到交易提案</span>
          </div>
          <div className="text-xs text-white space-y-1">
            <div>来自: {players.find(p => p.id === tradeOffer.fromPlayerId)?.name}</div>
            <div>给你: {Object.entries(tradeOffer.offer).filter(([_, v]) => (v as number | undefined) && (v as number) > 0).map(([k, v]) => `${v} ${RESOURCE_NAMES[k as ResourceType]}`).join(', ') || '无'}</div>
            <div>需要: {Object.entries(tradeOffer.request).filter(([_, v]) => (v as number | undefined) && (v as number) > 0).map(([k, v]) => `${v} ${RESOURCE_NAMES[k as ResourceType]}`).join(', ') || '无'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => gameService.acceptTrade()} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold">
              接受
            </button>
            <button onClick={() => gameService.rejectTrade()} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-xs font-bold">
              拒绝
            </button>
          </div>
        </div>
      )}

      {/* 我的交易提案状态 */}
      {myTradeOffer && tradeOffer && (
        <div className="bg-blue-500/20 border-b-2 border-blue-500 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandMetal size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-blue-500">等待对方回应</span>
            </div>
            <button onClick={() => gameService.cancelTrade()} className="text-red-500 hover:text-red-400 text-xs font-bold">
              取消
            </button>
          </div>
          <div className="text-xs text-white space-y-1">
            <div>发给: {players.find(p => p.id === tradeOffer.toPlayerId)?.name}</div>
            <div>你给: {Object.entries(tradeOffer.offer).filter(([_, v]) => (v as number | undefined) && (v as number) > 0).map(([k, v]) => `${v} ${RESOURCE_NAMES[k as ResourceType]}`).join(', ') || '无'}</div>
            <div>你要: {Object.entries(tradeOffer.request).filter(([_, v]) => (v as number | undefined) && (v as number) > 0).map(([k, v]) => `${v} ${RESOURCE_NAMES[k as ResourceType]}`).join(', ') || '无'}</div>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-700 bg-slate-950/50">
          {[
            { id: 'main', icon: LayoutGrid, label: '控制台' },
            { id: 'trade', icon: Ship, label: '贸易' },
            { id: 'cards', icon: CreditCard, label: '卡牌' },
            { id: 'players', icon: Users, label: '势力' }
          ].map(t => (
            <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)} 
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'bg-slate-800 text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <t.icon size={16} />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{t.label}</span>
            </button>
          ))}
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 min-h-0">
        {activeTab === 'main' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-black text-white leading-none">CATAN <span className="text-amber-500 italic text-sm">Online</span></h2>
              <button 
                onClick={() => gameService.toggleDebugMode()} 
                className={`p-2 rounded border transition-all ${
                  debugMode 
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500 shadow-lg shadow-amber-500/20' 
                    : 'text-slate-600 hover:text-slate-400 border-slate-700'
                }`}
              >
                  <Wrench size={14} />
              </button>
            </div>

            {debugMode && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg animate-pulse-slow">
                <div className="flex items-center gap-2">
                  <Wrench size={12} className="text-amber-500" />
                  <span className="text-[10px] text-amber-500 font-bold uppercase">调试模式已启用</span>
                </div>
                <p className="text-[9px] text-amber-400/80 mt-1">可直接编辑资源数量</p>
              </div>
            )}

            {/* 地图构建阶段：显示种子和港口设置 */}
            {phase === GamePhase.MAP_BUILDING && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">地图构建</div>
                
                {/* 地形种子 */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">地形种子</label>
                  <input 
                    type="text" 
                    value={inputTerrainSeed}
                    onChange={(e) => setInputTerrainSeed(e.target.value)}
                    placeholder="留空自动生成"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
                  />
                </div>

                {/* 点数种子 */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">点数种子</label>
                  <input 
                    type="text" 
                    value={inputTokenSeed}
                    onChange={(e) => setInputTokenSeed(e.target.value)}
                    placeholder="留空自动生成"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
                  />
                </div>

                {/* 港口数量 */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">港口数量</label>
                  <input 
                    type="number" 
                    value={inputPortCount}
                    onChange={(e) => setInputPortCount(parseInt(e.target.value) || 0)}
                    min="0"
                    max="30"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
                  />
                </div>

                {/* 操作按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => gameService.regenerateMap(inputTerrainSeed || undefined, inputTokenSeed || undefined, inputPortCount)} 
                    className="py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} /> 刷新地图
                  </button>
                  <button 
                    onClick={() => gameService.regenerateTokens(inputTokenSeed || undefined)} 
                    className="py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} /> 刷新点数
                  </button>
                </div>
              </div>
            )}

            {/* 初始放置阶段和游戏阶段：显示资源卡 */}
            {(phase === GamePhase.SETUP || (!isMapBuilding && !isSetup)) && (
              <div className="space-y-3">
                  <div className="flex justify-between items-end">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase">我的资源</h3>
                      <span className="text-[10px] text-slate-600 font-mono bg-slate-950 px-2 py-0.5 rounded">{Object.values(player.resources).reduce((a, b) => (a as number) + (b as number), 0)} 张</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                      {resourceOptions.map((res) => {
                          const count = player.resources[res];
                          return debugMode ? (
                              <div key={res} className="flex flex-col items-center gap-1 bg-slate-800/40 p-2 rounded border border-amber-500/30">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res] }}></div>
                                  <input 
                                      type="number" 
                                      value={count} 
                                      onChange={(e) => gameService.setPlayerResource(playerId, res, parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-950 border border-amber-500/30 rounded px-1 text-center font-black text-sm text-white"
                                      min="0"
                                  />
                              </div>
                          ) : (
                              <ResourceCard 
                                  key={res}
                                  resource={res}
                                  count={count}
                                  size="small"
                              />
                          );
                      })}
                  </div>
              </div>
            )}

            {/* 游戏阶段：显示骰子 */}
            {!isSetup && !isMapBuilding && (
              <div className="bg-slate-950/50 p-5 rounded-2xl flex flex-col items-center gap-4 border border-slate-700/50 shadow-inner">
                <div className="flex gap-4 font-mono text-3xl font-black">
                    <div className="w-12 h-12 bg-white text-slate-950 rounded-xl flex items-center justify-center">{dice[0] || '·'}</div>
                    <div className="w-12 h-12 bg-white text-slate-950 rounded-xl flex items-center justify-center">{dice[1] || '·'}</div>
                </div>
                <button 
                  onClick={onRollDice} 
                  disabled={!isMyTurn || phase === GamePhase.GAME_OVER || gameState.hasRolledDice} 
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all ${
                    isMyTurn && phase !== GamePhase.GAME_OVER && !gameState.hasRolledDice
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                    <Dices size={20} /> {phase === GamePhase.ROLL_DICE ? '掷骰子' : gameState.hasRolledDice ? '已掷骰子' : '掷骰子'}
                </button>
              </div>
            )}
         
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="flex gap-2 p-1 bg-slate-950 rounded-lg">
                <button onClick={() => setTradeMode('bank')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeMode === 'bank' ? 'bg-slate-800 text-amber-500' : 'text-slate-500'}`}>海运/银行</button>
                <button onClick={() => setTradeMode('player')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeMode === 'player' ? 'bg-slate-800 text-amber-500' : 'text-slate-500'}`}>玩家交易</button>
            </div>

            {tradeMode === 'bank' ? (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-white">银行交易（任意4个换1个）</h3>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">给出资源（至少4个）</label>
                        <div className="grid grid-cols-5 gap-2">
                            {resourceOptions.map(res => (
                                <div key={res} className="flex flex-col items-center gap-1">
                                    <ResourceCard 
                                        resource={res}
                                        count={player.resources[res]}
                                        size="small"
                                        showCount={false}
                                    />
                                    <span className="text-xs font-bold text-white">{bankGive[res] || 0}</span>
                                    <div className="flex flex-col gap-0.5 w-full">
                                        <button 
                                            onClick={() => setBankGive(prev => ({ ...prev, [res]: Math.min(player.resources[res], (prev[res] || 0) + 1) }))}
                                            className="w-full h-5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white font-bold flex items-center justify-center"
                                        >+</button>
                                        <button 
                                            onClick={() => setBankGive(prev => ({ ...prev, [res]: Math.max(0, (prev[res] || 0) - 1) }))}
                                            className="w-full h-5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white font-bold flex items-center justify-center"
                                        >-</button>
                                    </div>
                                    <span className="text-[9px] text-slate-500">有{player.resources[res]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-xs font-bold mt-2">
                            <span className={totalBankGive >= 4 ? 'text-amber-500' : 'text-slate-500'}>
                                已选择: {totalBankGive} 个
                            </span>
                            {canBankTrade && (
                                <span className="text-green-500 ml-2">
                                    (可换 {bankGetAmount} 个)
                                </span>
                            )}
                            {!canBankTrade && totalBankGive > 0 && (
                                <span className="text-red-500 ml-2">
                                    (还需 {4 - totalBankGive} 个)
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <ArrowUpDown size={16} className="text-slate-700" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">获得资源</label>
                        <div className="grid grid-cols-5 gap-2">
                            {resourceOptions.map(res => (
                                <button 
                                    key={res} 
                                    onClick={() => setBankGet(res)} 
                                    className={`flex flex-col items-center p-2 rounded border transition-all ${
                                        bankGet === res 
                                            ? 'border-amber-500 bg-amber-500/10 scale-105' 
                                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                    }`}
                                >
                                    <ResourceCard 
                                        resource={res}
                                        count={1}
                                        size="small"
                                        showCount={false}
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 mt-1">
                                        {canBankTrade ? `+${bankGetAmount}` : '+0'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleBankTrade} 
                        disabled={!isMyTurn || !canBankTrade} 
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl transition-all"
                    >
                        {!canBankTrade ? '至少需要4个资源' : `确认交易 (${totalBankGive}换${bankGetAmount})`}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-white">玩家交易</h3>
                    
                    {/* 选择交易对象 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">选择交易对象</label>
                        <select 
                            value={selectedPlayer}
                            onChange={(e) => setSelectedPlayer(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                            <option value="">-- 选择玩家 --</option>
                            {otherPlayers.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({Object.values(p.resources).reduce((a: number, b) => a + (b as number), 0)} 张卡)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 你的出价 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">你的出价</label>
                        <div className="grid grid-cols-1 gap-2">
                            {resourceOptions.map(res => (
                                <div key={res} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <ResourceCard 
                                            resource={res}
                                            count={player.resources[res]}
                                            size="small"
                                            showCount={false}
                                        />
                                        <div className="flex flex-col flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-300">{RESOURCE_NAMES[res]}</span>
                                            <span className="text-[9px] text-slate-500">有{player.resources[res]}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-black text-white w-6 text-center">{playerOffer[res] || 0}</span>
                                        <div className="flex flex-col gap-0.5">
                                            <button 
                                                onClick={() => setPlayerOffer(p => ({...p, [res]: Math.min(player.resources[res], (p[res] || 0) + 1)}))} 
                                                className="w-6 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center"
                                            >+</button>
                                            <button 
                                                onClick={() => setPlayerOffer(p => ({...p, [res]: Math.max(0, (p[res] || 0) - 1)}))} 
                                                className="w-6 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center"
                                            >-</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 你的需求 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">你的需求</label>
                        <div className="grid grid-cols-1 gap-2">
                            {resourceOptions.map(res => (
                                <div key={res} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <ResourceCard 
                                            resource={res}
                                            count={1}
                                            size="small"
                                            showCount={false}
                                        />
                                        <span className="text-xs font-bold text-slate-300 flex-shrink-0">{RESOURCE_NAMES[res]}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-black text-white w-6 text-center">{playerRequest[res] || 0}</span>
                                        <div className="flex flex-col gap-0.5">
                                            <button 
                                                onClick={() => setPlayerRequest(p => ({...p, [res]: (p[res] || 0) + 1}))} 
                                                className="w-6 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center"
                                            >+</button>
                                            <button 
                                                onClick={() => setPlayerRequest(p => ({...p, [res]: Math.max(0, (p[res] || 0) - 1)}))} 
                                                className="w-6 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center"
                                            >-</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 发送提案按钮 */}
                    <button 
                        onClick={handleProposeTrade} 
                        disabled={!isMyTurn || !selectedPlayer || myTradeOffer !== undefined} 
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl transition-all"
                    >
                        {myTradeOffer ? '已发送提案，等待回应' : '发送交易提案'}
                    </button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            <h3 className="text-lg font-black text-white">我的卡牌</h3>
            
            {/* 资源卡展示 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">资源卡</label>
                <span className="text-xs text-slate-600 font-mono">
                  {Object.values(player.resources).reduce((a, b) => (a as number) + (b as number), 0)} 张
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {resourceOptions.map(res => (
                  <ResourceCard 
                    key={res}
                    resource={res}
                    count={player.resources[res]}
                    size="medium"
                  />
                ))}
              </div>
            </div>

            {/* 发展卡展示 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">发展卡</label>
                <button 
                  onClick={() => gameService.buyDevelopmentCard()} 
                  disabled={!isMyTurn || phase !== GamePhase.MAIN_TURN} 
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[9px] font-black rounded uppercase"
                >
                  购买
                </button>
              </div>
              
              {player.developmentCards.length === 0 ? (
                <div className="text-center text-slate-600 text-xs py-6 bg-slate-800/30 rounded-lg border border-slate-800">
                  还没有发展卡
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {player.developmentCards.map(card => (
                    <DevelopmentCard
                      key={card.id}
                      type={card.type}
                      isNew={card.isNew}
                      isReady={!card.isNew && isMyTurn}
                      size="medium"
                      onClick={() => !card.isNew && isMyTurn && gameService.playDevelopmentCard(card.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'players' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> 海岛榜单</h3>
                <div className="space-y-3">
                    {players.map(p => {
                        const hasLargestArmy = gameState.largestArmyPlayerId === p.id;
                        const displayVP = p.victoryPoints - p.hiddenVictoryPoints;
                        return (
                            <div key={p.id} className={`p-4 rounded-2xl border ${p.id === currentPlayerId ? 'bg-slate-800 border-amber-500/40 shadow-xl' : 'bg-slate-900/50 border-slate-800'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                        <span className="font-black text-sm uppercase">{p.name}</span>
                                        {hasLargestArmy && (
                                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">⚔️ 最大骑士</span>
                                        )}
                                    </div>
                                    <span className="text-amber-500 font-black text-xl">{displayVP} VP</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                    <div className="bg-slate-950/40 px-2 py-1.5 rounded-lg flex justify-between"><span>军力:</span> <span className="text-white">{p.armySize}</span></div>
                                    <div className="bg-slate-950/40 px-2 py-1.5 rounded-lg flex justify-between"><span>资源:</span> <span className="text-white">{Object.values(p.resources).reduce((a,b)=>(a as number)+(b as number), 0)}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <button 
          onClick={onEndTurn}
          disabled={
            phase === GamePhase.GAME_OVER || 
            (isMapBuilding && false) || // 地图构建阶段按钮始终可用
            (isSetup && !player.setupLocked && !setupFinished) || 
            (!isSetup && !isMapBuilding && (!isMyTurn || phase === GamePhase.ROLL_DICE))
          }
          className={`w-full py-5 rounded-2xl font-black mt-auto shadow-2xl transition-all ${
            isMapBuilding
              ? 'bg-green-600 hover:bg-green-500'
              : isSetup 
                ? player.setupLocked 
                  ? 'bg-amber-600 hover:bg-amber-500' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
                : 'bg-rose-600 hover:bg-rose-500'
          } disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white`}
        >
          {isMapBuilding
            ? "✅ 地图构建完成"
            : isSetup 
              ? player.setupLocked 
                ? "🔓 解锁初始布局" 
                : setupFinished 
                  ? "🔒 锁定初始布局" 
                  : `还需放置 ${2 - player.setupSettlements} 个定居点和 ${2 - player.setupRoads} 条道路`
              : phase === GamePhase.ROLL_DICE 
                ? "请先掷骰子" 
                : "结束当前回合"}
        </button>
      </div>
    </div>
  );
};

const X = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
