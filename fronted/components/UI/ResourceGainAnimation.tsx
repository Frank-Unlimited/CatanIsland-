import React, { useEffect, useState } from 'react';
import { ResourceType } from '../../types';
import { ResourceCard } from './ResourceCard';

interface ResourceGain {
  id: string;
  resource: ResourceType;
  count: number;
  timestamp: number;
}

interface Props {
  gains: ResourceGain[];
  onComplete: (id: string) => void;
}

export const ResourceGainAnimation: React.FC<Props> = ({ gains, onComplete }) => {
  // 按资源类型合并相同的资源
  const mergedGains = React.useMemo(() => {
    console.log('[ResourceGainAnimation] 原始 gains:', gains);
    const merged = new Map<ResourceType, {gain: ResourceGain, ids: string[]}>();
    
    gains.forEach(gain => {
      console.log(`[ResourceGainAnimation] 处理 gain: ${gain.resource} x${gain.count}`);
      const existing = merged.get(gain.resource);
      if (existing) {
        // 合并相同资源的数量
        console.log(`[ResourceGainAnimation] 合并: ${existing.gain.count} + ${gain.count}`);
        existing.gain.count += gain.count;
        existing.ids.push(gain.id);
      } else {
        merged.set(gain.resource, { 
          gain: { ...gain }, 
          ids: [gain.id] 
        });
      }
    });
    
    const result = Array.from(merged.values());
    console.log('[ResourceGainAnimation] 合并后的结果:', result);
    return result;
  }, [gains]);

  const handleComplete = (ids: string[]) => {
    // 完成时清除所有相关的 id
    ids.forEach(id => onComplete(id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      {mergedGains.map((item, index) => (
        <AnimatedCard
          key={item.gain.id}
          gain={item.gain}
          index={index}
          totalCards={mergedGains.length}
          onComplete={() => handleComplete(item.ids)}
        />
      ))}
    </div>
  );
};

interface AnimatedCardProps {
  gain: ResourceGain;
  index: number;
  totalCards: number;
  onComplete: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ gain, index, totalCards, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 动画持续时间
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // 等待淡出动画完成
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // 计算卡牌的偏移位置（如果同时获得多张卡牌）
  const offsetX = (index - Math.floor(totalCards / 2)) * 80;

  return (
    <div
      className={`absolute transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={{
        transform: `translateX(${offsetX}px)`,
        animation: isVisible ? 'cardFlyIn 0.5s ease-out, cardFloat 1.5s ease-in-out 0.5s' : 'none'
      }}
    >
      <div className="relative">
        {/* 发光效果 */}
        <div className="absolute inset-0 bg-amber-500/30 rounded-lg blur-xl animate-pulse"></div>
        
        {/* 卡牌 - 不显示数量徽章 */}
        <div className="relative transform scale-150">
          <ResourceCard
            resource={gain.resource}
            count={gain.count}
            size="large"
            showCount={false}
          />
        </div>

        {/* 数量文字 - 始终显示 */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-amber-500 px-4 py-2 rounded-full shadow-lg">
          <span className="text-white font-black text-2xl">+{gain.count}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardFlyIn {
          0% {
            transform: translateY(-100vh) translateX(${offsetX}px) scale(0.5) rotate(-20deg);
            opacity: 0;
          }
          60% {
            transform: translateY(0) translateX(${offsetX}px) scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0) translateX(${offsetX}px) scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes cardFloat {
          0%, 100% {
            transform: translateY(0) translateX(${offsetX}px);
          }
          50% {
            transform: translateY(-20px) translateX(${offsetX}px);
          }
        }
      `}</style>
    </div>
  );
};
