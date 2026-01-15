import React, { useState } from 'react';
import { ResourceType, Player } from '../../types';
import { RESOURCE_COLORS, RESOURCE_NAMES } from '../../constants';
import { AlertTriangle } from 'lucide-react';
import { ResourceCard } from './ResourceCard';

interface Props {
  player: Player;
  requiredDiscard: number;
  onDiscard: (resources: Partial<Record<ResourceType, number>>) => void;
}

export const DiscardPanel: React.FC<Props> = ({ player, requiredDiscard, onDiscard }) => {
  const [selectedResources, setSelectedResources] = useState<Partial<Record<ResourceType, number>>>({});
  
  const resourceOptions = (Object.keys(RESOURCE_NAMES) as ResourceType[]).filter(r => r !== ResourceType.DESERT);
  
  // 计算已选择的资源总数
  const totalSelected: number = (Object.values(selectedResources) as number[]).reduce((sum, val) => sum + (val || 0), 0);
  const canConfirm = totalSelected === requiredDiscard;

  const handleIncrement = (res: ResourceType) => {
    const current = selectedResources[res] || 0;
    const available = player.resources[res];
    
    if (current < available && totalSelected < requiredDiscard) {
      setSelectedResources(prev => ({ ...prev, [res]: current + 1 }));
    }
  };

  const handleDecrement = (res: ResourceType) => {
    const current = selectedResources[res] || 0;
    
    if (current > 0) {
      setSelectedResources(prev => ({ ...prev, [res]: current - 1 }));
    }
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onDiscard(selectedResources);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-md w-full shadow-2xl">
        {/* 标题栏 */}
        <div className="bg-red-500/20 border-b border-red-500 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-500" />
            <div>
              <h2 className="text-xl font-black text-white">强盗事件</h2>
              <p className="text-sm text-red-400">你的资源超过7张，必须弃掉一半</p>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">当前资源总数：</span>
              <span className="text-white font-bold">{(Object.values(player.resources) as number[]).reduce((a, b) => a + b, 0)} 张</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">需要弃掉：</span>
              <span className="text-red-500 font-bold">{requiredDiscard} 张</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">已选择：</span>
              <span className={`font-bold ${canConfirm ? 'text-green-500' : 'text-amber-500'}`}>
                {totalSelected} 张
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">选择要弃掉的资源</label>
            <div className="space-y-2">
              {resourceOptions.map(res => {
                const available = player.resources[res];
                const selected = selectedResources[res] || 0;
                
                if (available === 0) return null;
                
                return (
                  <div key={res} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <ResourceCard 
                        resource={res}
                        count={available}
                        size="small"
                        showCount={false}
                      />
                      <div>
                        <span className="text-sm font-bold text-white block">{RESOURCE_NAMES[res]}</span>
                        <span className="text-xs text-slate-500">拥有 {available} 张</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDecrement(res)}
                        disabled={selected === 0}
                        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-white font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="text-lg font-black text-white w-8 text-center">{selected}</span>
                      <button 
                        onClick={() => handleIncrement(res)}
                        disabled={selected >= available || totalSelected >= requiredDiscard}
                        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-white font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-slate-700 p-4">
          <button 
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`w-full py-3 rounded-xl font-black transition-all ${
              canConfirm 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {canConfirm ? '确认弃牌' : `还需选择 ${requiredDiscard - (totalSelected as number)} 张`}
          </button>
        </div>
      </div>
    </div>
  );
};
