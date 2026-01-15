import React from 'react';
import { X, Home, Castle, Milestone, Scroll, Ship, Dices, Trophy } from 'lucide-react';
import { DEV_CARD_DESCRIPTIONS } from '../../constants';

interface Props {
  onClose: () => void;
}

export const GameRules: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">游戏说明</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 游戏目标 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-lg font-black text-white">游戏目标</h3>
            </div>
            <p className="text-slate-300 text-sm">
              第一个达到 <span className="text-amber-500 font-bold">10 胜利点</span> 的玩家获胜！
            </p>
          </section>

          {/* 建筑价格 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Home size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-white">建筑价格</h3>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Milestone size={16} className="text-slate-400" />
                  <span className="text-white font-bold">道路</span>
                </div>
                <span className="text-slate-400">1木 + 1砖</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-slate-400" />
                  <span className="text-white font-bold">定居点</span>
                </div>
                <span className="text-slate-400">1木 + 1砖 + 1羊 + 1麦</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Castle size={16} className="text-slate-400" />
                  <span className="text-white font-bold">城市</span>
                </div>
                <span className="text-slate-400">3矿 + 2麦</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Scroll size={16} className="text-slate-400" />
                  <span className="text-white font-bold">发展卡</span>
                </div>
                <span className="text-slate-400">1羊 + 1麦 + 1矿</span>
              </div>
            </div>
          </section>

          {/* 胜利点获取 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-lg font-black text-white">胜利点获取</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>定居点：<span className="text-white font-bold">1 点</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>城市：<span className="text-white font-bold">2 点</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>胜利点发展卡：<span className="text-white font-bold">1 点</span></span>
              </li>
            </ul>
          </section>

          {/* 回合流程 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Dices size={20} className="text-green-500" />
              <h3 className="text-lg font-black text-white">回合流程</h3>
            </div>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">1.</span>
                <span><span className="text-white font-bold">掷骰子</span> - 所有玩家根据点数获得资源</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">2.</span>
                <span><span className="text-white font-bold">行动阶段</span> - 可以建造、交易、使用发展卡</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">3.</span>
                <span><span className="text-white font-bold">结束回合</span> - 轮到下一位玩家</span>
              </li>
            </ol>
          </section>

          {/* 交易规则 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Ship size={20} className="text-purple-500" />
              <h3 className="text-lg font-black text-white">交易规则</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div>
                <span className="text-white font-bold">银行交易：</span>
                <span className="ml-2">任意 4 个资源换 1 个任意资源</span>
              </div>
              <div>
                <span className="text-white font-bold">玩家交易：</span>
                <span className="ml-2">与其他玩家自由协商交易比例</span>
              </div>
            </div>
          </section>

          {/* 发展卡说明 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Scroll size={20} className="text-indigo-500" />
              <h3 className="text-lg font-black text-white">发展卡</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(DEV_CARD_DESCRIPTIONS).map(([type, desc]) => (
                <div key={type} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-bold text-white mb-1">{type}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 italic">
              * 新购买的发展卡需要等到下回合才能使用
            </p>
          </section>

          {/* 初始放置 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Home size={20} className="text-orange-500" />
              <h3 className="text-lg font-black text-white">初始放置</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>每位玩家放置 <span className="text-white font-bold">2 个定居点</span> 和 <span className="text-white font-bold">2 条道路</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>所有玩家同时放置，可以随时撤销（点击自己的建筑）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>完成后点击"锁定"按钮，等待其他玩家</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>所有玩家锁定后，第 2 个定居点相邻地形产出初始资源</span>
              </li>
            </ul>
          </section>

          {/* 特殊规则 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Dices size={20} className="text-red-500" />
              <h3 className="text-lg font-black text-white">特殊规则</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <div>
                  <span className="text-white font-bold">掷出 7：</span>
                  <div className="ml-4 mt-1 space-y-1 text-xs">
                    <div>1. 资源超过7张的玩家自己选择弃掉一半（向下取整）</div>
                    <div>2. 移动强盗到任意地形板块</div>
                    <div>3. 从该板块相邻的玩家中任选一名，随机偷取1张资源</div>
                    <div>4. 被强盗占领的板块无法产出资源</div>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><span className="text-white font-bold">距离规则：</span>定居点之间必须间隔至少 1 条道路</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><span className="text-white font-bold">道路连接：</span>建造定居点和道路必须连接到自己的建筑</span>
              </li>
            </ul>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
