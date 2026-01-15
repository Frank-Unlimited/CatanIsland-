import React from 'react';
import { Player } from '../../types';
import { Skull } from 'lucide-react';

interface Props {
  victims: Player[];
  onSteal: (victimId: string) => void;
}

export const StealPanel: React.FC<Props> = ({ victims, onSteal }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl max-w-md w-full shadow-2xl">
        {/* 标题栏 */}
        <div className="bg-purple-500/20 border-b border-purple-500 p-4">
          <div className="flex items-center gap-3">
            <Skull size={24} className="text-purple-500" />
            <div>
              <h2 className="text-xl font-black text-white">偷取资源</h2>
              <p className="text-sm text-purple-400">选择一个玩家偷取1张资源卡</p>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-3">
          {victims.map(victim => {
            const totalResources = Object.values(victim.resources).reduce((a, b) => a + b, 0);
            
            return (
              <button
                key={victim.id}
                onClick={() => onSteal(victim.id)}
                disabled={totalResources === 0}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  totalResources > 0
                    ? 'border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/20 hover:border-purple-500'
                    : 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: victim.color }}></div>
                    <span className="text-lg font-black text-white">{victim.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">资源卡</div>
                    <div className="text-xl font-black text-white">{totalResources} 张</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {victims.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            没有可以偷取的玩家
          </div>
        )}
      </div>
    </div>
  );
};
