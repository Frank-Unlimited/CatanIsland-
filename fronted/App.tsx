
import React, { useEffect, useState } from 'react';
import { GameState, GamePhase, Port, ResourceType, DevCardType } from './types';
import { gameService } from './services/gameService';
import { animationService } from './services/animationService';
import { CatanMap } from './components/Map/CatanMap';
import { ActionPanel } from './components/UI/ActionPanel';
import { GameLog } from './components/UI/GameLog';
import { Toast } from './components/UI/Toast';
import { GameRules } from './components/UI/GameRules';
import { DiscardPanel } from './components/UI/DiscardPanel';
import { StealPanel } from './components/UI/StealPanel';
import { CardGainAnimation } from './components/UI/CardGainAnimation';
import { YearOfPlentyPanel } from './components/UI/YearOfPlentyPanel';
import { MonopolyPanel } from './components/UI/MonopolyPanel';
import { Hexagon, Trophy, RefreshCcw, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const [portOverride, setPortOverride] = useState<Port | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [cardGains, setCardGains] = useState<Array<{id: string, cardType: 'RESOURCE' | 'DEVELOPMENT', card: ResourceType | DevCardType, count: number, playerName: string, action: 'GAIN' | 'USE'}>>([]);
  const lastAnimationTimestampRef = React.useRef<number>(0);
  const toastIdRef = React.useRef(0);

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }

    // 连接到后端服务器
    // 如果是 localhost，使用 localhost；否则使用当前主机的地址
    const hostname = window.location.hostname;
    const serverUrl = `ws://${hostname === 'localhost' ? 'localhost' : hostname}:8080`;
    
    console.log(`[App] 连接到服务器: ${serverUrl}, 玩家名称: ${playerName}`);
    
    gameService.connect(serverUrl, playerName.trim());
    setHasJoined(true);
  };

  useEffect(() => {
    if (!hasJoined) return;

    const unsubscribeState = gameService.subscribe((newState) => {
      // 处理广播的卡牌动画
      if (newState.cardAnimation && newState.cardAnimation.timestamp > lastAnimationTimestampRef.current) {
        const anim = newState.cardAnimation;
        animationService.showCardGain(
          anim.cardType,
          anim.card,
          anim.count,
          anim.playerName,
          anim.action
        );
        lastAnimationTimestampRef.current = anim.timestamp;
      }
      
      setGameState(newState);
    });

    const unsubscribeNotify = gameService.onNotification((message, type) => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    });

    const unsubscribeConnection = gameService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
    });

    const unsubscribeAnimation = animationService.subscribe((gains) => {
      setCardGains(gains);
    });

    return () => {
        unsubscribeState();
        unsubscribeNotify();
        unsubscribeConnection();
        unsubscribeAnimation();
        gameService.disconnect();
    };
  }, [hasJoined]);

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 显示加入游戏界面
  if (!hasJoined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
          <div className="relative">
            <Hexagon size={80} className="text-amber-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-black text-3xl text-white">C</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-black text-4xl tracking-widest uppercase">CATAN</h1>
            <p className="text-slate-500 text-sm font-mono uppercase">在线版</p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                玩家名称
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                placeholder="输入你的名字"
                maxLength={20}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={handleJoinGame}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              加入游戏
            </button>
          </div>

          <div className="text-center text-xs text-slate-600 space-y-1">
            <p>服务器地址: ws://{window.location.hostname}:8080</p>
            <p>你的 ID 将由服务器自动分配</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="relative">
                <Hexagon size={64} className="text-amber-500 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-black text-xl text-white">C</span>
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <p className="font-black text-2xl tracking-widest uppercase">CATAN</p>
                <p className="text-slate-500 text-xs font-mono uppercase">
                  {connected ? '正在生成海岛...' : '正在连接服务器...'}
                </p>
                {!connected && (
                  <p className="text-red-500 text-xs mt-2">
                    连接地址: ws://{window.location.hostname}:8080
                  </p>
                )}
            </div>
        </div>
      </div>
    );
  }

  const handleBuildRoad = (edgeId: string) => { gameService.buildRoad(edgeId); };
  const handleVertexInteraction = (vertexId: string) => { gameService.handleVertexClick(vertexId); };
  const handleMoveRobber = (hexId: string) => { gameService.moveRobber(hexId); };
  const handleRemoveRoad = (edgeId: string) => { gameService.removeRoad(edgeId); };
  const handleRemoveBuilding = (vertexId: string) => { gameService.removeBuilding(vertexId); };
  
  const handlePortInteraction = (port: Port) => {
      setPortOverride(port);
      // Automatically switch to trade tab if desired, or let the user see the notification
  };

  // 处理弃牌
  const handleDiscard = (resources: Partial<Record<import('./types').ResourceType, number>>) => {
    gameService.discardResources(resources);
  };

  // 处理偷取
  const handleSteal = (victimId: string) => {
    gameService.stealFrom(victimId);
  };

  const winner = gameState.phase === GamePhase.GAME_OVER ? gameState.players.find((p: any) => p.victoryPoints >= 10) : null;

  return (
    <div className="h-screen w-screen flex bg-slate-900 overflow-hidden relative">
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 z-50 pointer-events-none">
          {toasts.map(toast => (
              <div key={toast.id} className="pointer-events-auto">
                  <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
              </div>
          ))}
      </div>

      <div className="flex-1 relative flex flex-col">
        {gameState.phase === GamePhase.GAME_OVER && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center">
                <div className="text-center space-y-8 p-12 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-amber-500 rounded-full animate-bounce"><Trophy size={64} className="text-slate-900" /></div>
                        <h1 className="text-4xl font-black text-white uppercase">游戏结束</h1>
                    </div>
                    <p className="text-amber-500 font-black text-2xl">{winner?.name} 获得了统治权！</p>
                    <button onClick={() => window.location.reload()} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-black flex items-center gap-2 mx-auto"><RefreshCcw size={20} /> 重新开始</button>
                </div>
            </div>
        )}

        <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none">
            <div className="flex justify-between items-center max-w-5xl mx-auto">
                 <div className="bg-slate-900/90 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700/50 text-slate-300 text-sm shadow-2xl pointer-events-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gameState.players.find(p => p.id === gameState.currentPlayerId)?.color }}></div>
                        <span className="font-black text-white">{gameState.players.find(p => p.id === gameState.currentPlayerId)?.name} 的回合</span>
                    </div>
                 </div>
                 <button 
                    onClick={() => setShowRules(true)}
                    className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 hover:border-amber-500/50 text-slate-300 hover:text-amber-500 text-sm shadow-2xl pointer-events-auto flex items-center gap-2 transition-all"
                 >
                    <BookOpen size={16} />
                    <span className="font-bold">游戏说明</span>
                 </button>
            </div>

            {/* 强盗移动提示 */}
            {(gameState.phase === GamePhase.ROBBER_PLACEMENT || gameState.phase === GamePhase.DISCARD_RESOURCES) && 
             gameState.currentPlayerId === gameService.getPlayerId() && (
              <div className="mt-4 max-w-5xl mx-auto pointer-events-auto">
                <div className="bg-red-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-red-400 shadow-2xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <div className="font-black text-white text-lg">
                        {gameState.phase === GamePhase.DISCARD_RESOURCES ? '强盗事件：请弃牌' : '强盗事件：请移动强盗'}
                      </div>
                      <div className="text-red-100 text-sm">
                        {gameState.phase === GamePhase.DISCARD_RESOURCES 
                          ? '你的资源超过7张，必须弃掉一半' 
                          : '点击地图上的任意地形板块来移动强盗'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 道路建设卡提示 */}
            {gameState.devCardAction?.type === 'ROAD_BUILDING' && 
             gameState.devCardAction.playerId === gameService.getPlayerId() && (
              <div className="mt-4 max-w-5xl mx-auto pointer-events-auto">
                <div className="bg-indigo-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-indigo-400 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🛤️</div>
                    <div>
                      <div className="font-black text-white text-lg">
                        道路建设卡
                      </div>
                      <div className="text-indigo-100 text-sm">
                        已建造 {gameState.devCardAction.data?.roadsBuilt || 0}/2 条道路，请在地图上选择位置建造
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        <CatanMap 
            gameState={gameState} 
            onBuildRoad={handleBuildRoad} 
            onBuildSettlement={handleVertexInteraction}
            onMoveRobber={handleMoveRobber}
            onPortClick={handlePortInteraction}
            onRemoveRoad={handleRemoveRoad}
            onRemoveBuilding={handleRemoveBuilding}
        />
        <GameLog logs={gameState.log} />
      </div>

      <ActionPanel 
        gameState={gameState} 
        playerId={gameService.getPlayerId()}
        onRollDice={() => gameService.rollDice()}
        onEndTurn={() => gameService.endTurn()}
        portOverride={portOverride}
        clearPortOverride={() => setPortOverride(null)}
      />

      {/* 弃牌面板 */}
      {gameState.phase === GamePhase.DISCARD_RESOURCES && 
       gameState.discardingPlayers?.includes(gameService.getPlayerId()) && (
        <DiscardPanel
          player={gameState.players.find((p: any) => p.id === gameService.getPlayerId())!}
          requiredDiscard={Math.floor((Object.values(gameState.players.find((p: any) => p.id === gameService.getPlayerId())!.resources) as number[]).reduce((a, b) => a + b, 0) / 2)}
          onDiscard={handleDiscard}
        />
      )}

      {/* 偷取面板 */}
      {gameState.phase === GamePhase.ROBBER_STEAL && 
       gameState.currentPlayerId === gameService.getPlayerId() && 
       gameState.stealingFrom.length > 0 && (
        <StealPanel
          victims={gameState.players.filter((p: any) => gameState.stealingFrom.includes(p.id))}
          onSteal={handleSteal}
        />
      )}

      {/* 丰饶卡面板 */}
      {gameState.devCardAction?.type === 'YEAR_OF_PLENTY' && 
       gameState.devCardAction.playerId === gameService.getPlayerId() && (
        <YearOfPlentyPanel
          resourcesChosen={gameState.devCardAction.data?.resourcesChosen || 0}
        />
      )}

      {/* 垄断卡面板 */}
      {gameState.devCardAction?.type === 'MONOPOLY' && 
       gameState.devCardAction.playerId === gameService.getPlayerId() && (
        <MonopolyPanel
          gameState={gameState}
        />
      )}

      {showRules && <GameRules onClose={() => setShowRules(false)} />}

      {/* 卡牌获取动画（资源卡和发展卡） */}
      <CardGainAnimation gains={cardGains} />
    </div>
  );
};

export default App;
