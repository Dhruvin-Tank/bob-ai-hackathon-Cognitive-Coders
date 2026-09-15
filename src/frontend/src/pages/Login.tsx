import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  Cpu,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-night-950 px-4 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#101828_1px,transparent_1px),linear-gradient(to_bottom,#101828_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8 p-8 rounded-3xl border border-night-700/80 bg-night-900/80 backdrop-blur-2xl shadow-2xl shadow-black/80">
        {/* Brand Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-volt-glow border border-cyan-400/30">
          <Zap className="h-10 w-10 text-white fill-white/20" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            IBM Hackathon • Problem U1 Edition
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            GridWatch <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            Predictive power-grid risk intelligence & equipment failure advisory system. Real-time transformer telemetry scoring and automated emergency dispatch.
          </p>
        </div>

        {/* 3 Feature Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-2xl border border-night-700 bg-night-800/80">
            <Activity className="h-5 w-5 text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-white">Continuous Telemetry</div>
            <div className="text-[11px] text-slate-400 mt-0.5">30-day thermal & vibration tracking</div>
          </div>
          <div className="p-3.5 rounded-2xl border border-night-700 bg-night-800/80">
            <Cpu className="h-5 w-5 text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-white">Predictive AI Engine</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Health score & time-to-failure calc</div>
          </div>
          <div className="p-3.5 rounded-2xl border border-night-700 bg-night-800/80">
            <ShieldCheck className="h-5 w-5 text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-white">Automated Triage</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rapid crew dispatch & work orders</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-base font-bold text-white shadow-volt-glow hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all transform active:scale-[0.99]"
          >
            <span>Launch Operator Console</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Connected to live backend on http://localhost:8000</span>
        </div>
      </div>
    </div>
  );
};
