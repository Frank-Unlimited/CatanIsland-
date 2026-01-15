import React from 'react';
import { ResourceType } from '../../types';
import { RESOURCE_COLORS, RESOURCE_NAMES } from '../../constants';

interface Props {
  resource: ResourceType;
  count?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  className?: string;
}

export const ResourceCard: React.FC<Props> = ({ 
  resource, 
  count = 0, 
  size = 'medium',
  showCount = true,
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
    medium: 'text-[8px]',
    large: 'text-[10px]'
  };

  const badgeSizes = {
    small: 'w-4 h-4 text-[8px]',
    medium: 'w-5 h-5 text-[10px]',
    large: 'w-6 h-6 text-xs'
  };

  const getResourceIcon = (res: ResourceType) => {
    switch (res) {
      case ResourceType.WOOD: return '🌲';
      case ResourceType.BRICK: return '🧱';
      case ResourceType.SHEEP: return '🐑';
      case ResourceType.WHEAT: return '🌾';
      case ResourceType.ORE: return '⛰️';
      default: return '❓';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 卡牌封面 */}
      <div 
        className={`${sizeClasses[size]} rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
          count > 0 
            ? 'border-slate-600 shadow-lg' 
            : 'border-slate-800 opacity-30'
        }`}
        style={{ 
          backgroundColor: count > 0 ? RESOURCE_COLORS[resource] : '#1e293b',
          backgroundImage: count > 0 
            ? `linear-gradient(135deg, ${RESOURCE_COLORS[resource]} 0%, ${RESOURCE_COLORS[resource]}dd 100%)`
            : 'none'
        }}
      >
        <div className={iconSizes[size]}>
          {getResourceIcon(resource)}
        </div>
        <div className={`${textSizes[size]} font-black uppercase text-center px-1 mt-0.5 ${
          count > 0 ? 'text-white' : 'text-slate-700'
        }`}>
          {RESOURCE_NAMES[resource]}
        </div>
      </div>
      {/* 数量标记 */}
      {showCount && count > 0 && (
        <div className={`absolute -top-1 -right-1 ${badgeSizes[size]} bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-900`}>
          <span className="font-black text-slate-950">{count}</span>
        </div>
      )}
    </div>
  );
};
