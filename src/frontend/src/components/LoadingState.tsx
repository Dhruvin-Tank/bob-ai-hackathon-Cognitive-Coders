import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading grid telemetry...',
  count = 3,
}) => {
  return (
    <div className="space-y-4 py-8">
      <div className="flex items-center justify-center gap-3 text-cyan-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium tracking-wide text-slate-300">
          {message}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-night-700 bg-night-800/60 p-6 space-y-4"
          >
            <div className="h-4 w-28 rounded bg-night-700" />
            <div className="h-8 w-20 rounded bg-night-700" />
            <div className="h-3 w-48 rounded bg-night-700/60" />
          </div>
        ))}
      </div>
    </div>
  );
};
