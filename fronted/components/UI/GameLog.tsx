
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';

export const GameLog: React.FC<{ logs: string[] }> = ({ logs }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`absolute bottom-6 left-6 w-80 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg flex flex-col shadow-xl z-20 transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-48'}`}>
        <div 
          className="p-2 border-b border-slate-700 bg-slate-800/50 rounded-t-lg flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
            <div className="flex items-center gap-2">
                <ScrollText size={14} className="text-amber-500" />
                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">游戏日志</h3>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
                {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[11px] text-slate-300 font-mono">
              {logs.length === 0 ? (
                  <div className="text-slate-600 italic">暂无日志...</div>
              ) : (
                  logs.map((log, i) => (
                      <div key={i} className="leading-tight border-b border-slate-800/50 pb-1 last:border-0">
                          <span className="text-slate-600 text-[9px] mr-2">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                          {log}
                      </div>
                  ))
              )}
          </div>
        )}
    </div>
  );
};
