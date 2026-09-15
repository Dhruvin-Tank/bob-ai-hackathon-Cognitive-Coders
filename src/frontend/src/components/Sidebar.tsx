import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Rows3,
  ClipboardList,
  Zap,
  LogOut,
  Flame,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Risk Map', icon: Map },
    { to: '/fleet', label: 'Fleet Registry', icon: Rows3 },
    { to: '/action-plan', label: 'Action Plan', icon: ClipboardList },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col justify-between border-r border-night-700 bg-night-900/95 p-3 backdrop-blur-xl transition-all duration-300 md:w-64 md:p-4">
      {/* Top: Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-volt-glow">
            <Zap className="h-6 w-6" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              GridWatch <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30">AI</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Power Grid Failure Advisor</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 shadow-[inset_0_0_12px_rgba(34,211,238,0.15)] border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-night-800 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="hidden md:inline">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Quick Demo Hero Link */}
          <div className="pt-4 border-t border-night-700/60 mt-4">
            <span className="hidden md:block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Demo Spotlight
            </span>
            <NavLink
              to="/asset/TX-114"
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-critical-glow'
                    : 'text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-500/20 bg-red-950/10'
                }`
              }
            >
              <Flame className="h-5 w-5 shrink-0 text-red-400 animate-pulse" />
              <div className="hidden md:block text-left">
                <div className="font-mono text-xs font-bold">TX-114 (Critical)</div>
                <div className="text-[10px] text-red-400/80">Thermal Runaway</div>
              </div>
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom: Logout / System Status */}
      <div className="border-t border-night-700 pt-3">
        <div className="hidden md:flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-night-800/80 border border-night-700/50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
            <span className="text-xs font-medium text-slate-300">SCADA Online</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">v1.0.0</span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-night-800 hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
