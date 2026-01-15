/**
 * 卡牌获取动画组件
 * 支持资源卡和发展卡两种类型
 */

import React, { useEffect, useState } from 'react';
import { ResourceType, DevCardType } from '../../types';
import { ResourceCard } from './ResourceCard';
import { DevelopmentCard } from './DevelopmentCard';

export interface CardGain {
  id: string;
  cardType: 'RESOURCE' | 'DEVELOPMENT';
  card: ResourceType | DevCardType;
  count: number;
  playerName: string;
  action: 'GAIN' | 'USE';
}

interface Props {
  gains: CardGain[];
}

export const CardGainAnimation: React.FC<Props> = ({ gains }) => {
  const [visibleGains, setVisibleGains] = useState<CardGain[]>([]);

  useEffect(() => {
    if (gains.length === 0) return;

    // 添加新的动画
    setVisibleGains(prev => [...prev, ...gains]);
    
    // 为每个动画设置移除定时器
    gains.forEach(gain => {
      setTimeout(() => {
        setVisibleGains(prev => prev.filter(v => v.id !== gain.id));
      }, 3000);
    });
  }, [gains]);

  if (visibleGains.length === 0) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="flex flex-col gap-4">
        {visibleGains.map((gain, index) => (
          <div
            key={gain.id}
            className="animate-in zoom-in-95 fade-in duration-500"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards'
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-4">
                {gain.cardType === 'RESOURCE' ? (
                  <ResourceCard
                    resource={gain.card as ResourceType}
                    count={gain.count}
                    size="large"
                  />
                ) : (
                  <DevelopmentCard
                    type={gain.card as DevCardType}
                    isNew={false}
                    isReady={false}
                    size="large"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-white">
                    {gain.playerName}
                  </span>
                  <span className="text-3xl font-black text-amber-500">
                    {gain.action === 'GAIN' ? '+' : ''}{gain.count}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {gain.action === 'GAIN' ? '获得' : '使用'}
                    {gain.cardType === 'RESOURCE' ? '资源卡' : '发展卡'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
