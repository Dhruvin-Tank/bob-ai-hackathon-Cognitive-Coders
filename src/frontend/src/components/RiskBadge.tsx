import React from 'react';
import { RiskLevel } from '../types/grid';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showDot = true,
}) => {
  const normalizedLevel = (level?.charAt(0).toUpperCase() + level?.slice(1).toLowerCase()) as RiskLevel;

  const config: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
    Critical: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
    },
    High: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500 shadow-[0_0_8px_#f97316]',
    },
    Medium: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    },
    Low: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    },
  };

  const current = config[normalizedLevel] || config.Low;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />}
      {normalizedLevel}
    </span>
  );
};
