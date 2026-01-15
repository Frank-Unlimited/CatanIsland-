import React from 'react';
import { DevCardType } from '../../types';

interface Props {
  type: DevCardType;
  isNew?: boolean;
  isReady?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

export const DevelopmentCard: React.FC<Props> = ({ 
  type, 
  isNew = false,
  isReady = false,
  size = 'medium',
  onClick,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-12',
    medium: 'w-12 h-16',
    large: 'w-16 h-24'
  };

  const iconSizes = {
    small: 'text-sm',
    medium: 'text-xl',
    large: 'text-3xl'
  };

  const textSizes = {
    small: 'text-[6px]',
    medium: 'text-[7px]',
    large: 'text-[9px]'
  };

  const badgeSizes = {
    small: 'w-3 h-3 text-[8px]',
    medium: 'w-4 h-4 text-[10px]',
    large: 'w-5 h-5 text-xs'
  };

  const getCardIcon = (cardType: DevCardType) => {
    switch (cardType) {
      case DevCardType.KNIGHT: return '⚔️';
      case DevCardType.ROAD_BUILDING: return '🛤️';
      case DevCardType.YEAR_OF_PLENTY: return '🎁';
      case DevCardType.MONOPOLY: return '💰';
      case DevCardType.VICTORY_POINT: return '🏆';
      default: return '❓';
    }
  };

  const getCardName = (cardType: DevCardType) => {
    switch (cardType) {
      case DevCardType.KNIGHT: return '骑士';
      case DevCardType.ROAD_BUILDING: return '道路建设';
      case DevCardType.YEAR_OF_PLENTY: return '丰收年';
      case DevCardType.MONOPOLY: return '垄断';
      case DevCardType.VICTORY_POINT: return '胜利点';
      default: return '未知';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 发展卡封面 */}
      <div 
        className={`${sizeClasses[size]} rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all ${
          isNew 
            ? 'border-slate-700 bg-slate-800/50 opacity-60' 
            : 'border-indigo-500/50 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 hover:border-indigo-400 shadow-lg'
        } ${onClick && !isNew ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className={iconSizes[size]}>
          {getCardIcon(type)}
        </div>
        <div className={`${textSizes[size]} font-black uppercase text-center text-white leading-tight mt-0.5`}>
          {getCardName(type)}
        </div>
      </div>
      {/* 状态标记 */}
      {isNew && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          <span className="text-[7px] font-bold text-slate-400">下回合</span>
        </div>
      )}
      {isReady && (
        <div className={`absolute -top-1 -right-1 ${badgeSizes[size]} bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900`}>
          <span className="text-[10px]">✓</span>
        </div>
      )}
    </div>
  );
};
