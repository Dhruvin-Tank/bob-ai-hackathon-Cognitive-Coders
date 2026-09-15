import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: 'red' | 'orange' | 'amber' | 'emerald' | 'cyan';
  variant?: 'default' | 'critical' | 'alert' | 'nominal';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'cyan',
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-night-700 hover:border-night-600',
    critical: 'border-red-500/40 bg-gradient-to-b from-night-800 to-red-950/20 shadow-critical-glow',
    alert: 'border-amber-500/40 bg-gradient-to-b from-night-800 to-amber-950/20',
    nominal: 'border-emerald-500/30 bg-gradient-to-b from-night-800 to-emerald-950/20',
  };

  const badgeColorStyles = {
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div
      className={`rounded-2xl border bg-night-800 p-5 transition-all duration-200 ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-700/60 text-cyan-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        {badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeColorStyles[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};
