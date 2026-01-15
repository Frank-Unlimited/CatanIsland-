/**
 * 资源垄断卡选择面板
 * 玩家选择一种资源，收集所有其他玩家的该资源
 */

import React from 'react';
import { ResourceType, GameState } from '../../types';
import { RESOURCE_NAMES } from '../../constants';
import { ResourceCard } from './ResourceCard';
import { gameService } from '../../services/gameService';

interface Props {
  gameState: GameState;
}

export const MonopolyPanel: React.FC<Props> = ({ gameState }) => {
  const resourceOptions = (Object.keys(RESOURCE_NAMES) as ResourceType[]).filter(r => r !== ResourceType.DESERT);

  const handleResourceClick = (resource: ResourceType) => {
    gameService.executeMonopoly(resource);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-white">💰 资源垄断</h3>
        </div>
        
        <p className="text-sm text-slate-400 mb-6">
          选择一种资源，收集所有其他玩家的该资源
        </p>

        <div className="grid grid-cols-5 gap-3">
          {resourceOptions.map(resource => (
            <button
              key={resource}
              onClick={() => handleResourceClick(resource)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-transparent hover:border-amber-500 transition-all transform hover:scale-105"
            >
              <ResourceCard 
                resource={resource}
                count={1}
                size="medium"
                showCount={false}
              />
              <span className="text-[9px] font-bold text-slate-400 text-center">
                {RESOURCE_NAMES[resource]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => gameService.cancelDevCardAction()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
