import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  getOperatorBrief,
  getCurrentWeather,
  getIncidents,
  runPredictions,
} from '../api/gridApi';
import {
  OperatorBrief,
  WeatherData,
  Incident,
} from '../types/grid';
import { KpiCard } from '../components/KpiCard';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [brief, setBrief] = useState<OperatorBrief | null>(null);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAI, setRunningAI] = useState<boolean>(false);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [briefData, weatherData, incidentsData] = await Promise.all([
        getOperatorBrief(),
        getCurrentWeather(),
        getIncidents(),
      ]);
      setBrief(briefData);
      setWeather(weatherData);
      setIncidents(incidentsData);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to connect to GridWatch API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunAI = async () => {
    try {
      setRunningAI(true);
      await runPredictions();
      await fetchDashboardData();
      const timestamp = new Date().toLocaleTimeString();
      setAiSuccessToast(`Predictive risk engine recalculated at ${timestamp}`);
      setTimeout(() => setAiSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to execute risk engine.');
    } finally {
      setRunningAI(false);
    }
  };

  if (loading && !brief) {
    return <LoadingState message="Connecting to SCADA telemetry & risk engine..." count={4} />;
  }

  if (error && !brief) {
    return <ErrorState message={error} onRetry={fetchDashboardData} isRetrying={loading} />;
  }

  // Chart data for donut
  const donutData = [
    { name: 'Critical', value: brief?.critical_risk_count || 0, color: '#ef4444' },
    { name: 'High', value: brief?.high_risk_count || 0, color: '#f97316' },
    { name: 'Medium', value: brief?.medium_risk_count || 0, color: '#f59e0b' },
    { name: 'Low', value: brief?.low_risk_count || 0, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const isCritical = brief?.grid_status === 'CRITICAL_ALERT';
  const isElevated = brief?.grid_status === 'ELEVATED_RISK';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & AI Trigger Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Grid Operations Center
            </h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-zone asset failure risk and automated dispatcher triage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {aiSuccessToast && (
            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300 animate-fade-in">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>{aiSuccessToast}</span>
            </div>
          )}

          <button
            onClick={handleRunAI}
            disabled={runningAI}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-volt-glow hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${runningAI ? 'animate-spin' : ''}`} />
            <span>{runningAI ? 'Simulating Grid AI...' : 'Run AI Risk Engine'}</span>
          </button>
        </div>
      </div>

      {/* Grid Status Executive Banner */}
      {isCritical ? (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/70 via-night-900 to-night-900 p-5 shadow-critical-glow">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <AlertOctagon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
                  CRITICAL_ALERT
                </span>
                <span className="text-xs text-red-300/80">Immediate Grid Intervention Required</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">
                {brief?.summary_text} High priority alert on <span className="font-mono text-red-400 font-bold underline cursor-pointer" onClick={() => navigate('/asset/TX-114')}>TX-114</span>: Top oil temperature reached critical threshold under 96% load. Emergency crew <span className="font-mono text-cyan-400">CREW-RAPID-01</span> dispatched.
              </p>
            </div>
            <button
              onClick={() => navigate('/asset/TX-114')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-colors"
            >
              <span>Inspect TX-114</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : isElevated ? (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-night-900 to-night-900 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                ELEVATED_RISK
              </span>
              <p className="text-sm text-slate-300 mt-0.5">{brief?.summary_text}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-night-900 to-night-900 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                NOMINAL_GRID_STATUS
              </span>
              <p className="text-sm text-slate-300 mt-0.5">{brief?.summary_text}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Monitored Assets"
          value={brief?.total_assets_monitored || 20}
          subtitle="5 Sectors (North to Central)"
          icon={Zap}
        />
        <KpiCard
          title="Critical Risk Assets"
          value={brief?.critical_risk_count || 0}
          subtitle="Imminent failure warning"
          icon={Flame}
          variant={brief?.critical_risk_count ? 'critical' : 'default'}
          badge={brief?.critical_risk_count ? 'Action Required' : '0 Alerts'}
          badgeColor="red"
        />
        <KpiCard
          title="High / Medium Risk"
          value={(brief?.high_risk_count || 0) + (brief?.medium_risk_count || 0)}
          subtitle="Under targeted surveillance"
          icon={AlertTriangle}
          badgeColor="orange"
        />
        <KpiCard
          title="Optimal Operational"
          value={brief?.low_risk_count || 0}
          subtitle="Operating at baseline"
          icon={CheckCircle2}
          variant="nominal"
        />
      </div>

      {/* Mid Section: Donut Chart & BLUF Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Severity Donut */}
        <div className="rounded-2xl border border-night-700 bg-night-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Risk Distribution
            </h2>
            <span className="text-xs font-mono text-slate-400">20 Total Assets</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101828',
                    border: '1px solid #253147',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-night-700/60">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-400">Critical: <strong className="text-white font-mono">{brief?.critical_risk_count}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-slate-400">High: <strong className="text-white font-mono">{brief?.high_risk_count}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">Medium: <strong className="text-white font-mono">{brief?.medium_risk_count}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Low: <strong className="text-white font-mono">{brief?.low_risk_count}</strong></span>
            </div>
          </div>
        </div>

        {/* BLUF Executive Intelligence Card */}
        <div className="rounded-2xl border border-night-700 bg-night-800 p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-night-700/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  BLUF — Bottom Line Up Front Intelligence
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Generated: {new Date(brief?.generated_at || '').toLocaleTimeString()}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                {brief?.summary_text}
              </p>

              <div className="rounded-xl border border-night-700 bg-night-900/60 p-3.5 space-y-2">
                <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Top Priority Directive
                </div>
                {brief?.action_items && brief.action_items.length > 0 ? (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-cyan-400">{brief.action_items[0].asset_id}</span>
                        <RiskBadge level={brief.action_items[0].risk_level} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{brief.action_items[0].action}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/asset/${brief.action_items[0].asset_id}`)}
                      className="shrink-0 rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                    >
                      View Asset
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No immediate critical action items queued.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-night-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Automated telemetry polling active across all 20 nodes.</span>
            <button
              onClick={() => navigate('/action-plan')}
              className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Action Plan</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weather & Environmental Widget (5 Zones) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Wind className="h-4 w-4 text-cyan-400" />
            <span>Multi-Zone Weather & Environmental Stress</span>
          </h2>
          <span className="text-xs text-slate-500">Live grid sector feeds</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {weather.map((w) => (
            <div
              key={w.zone}
              className={`rounded-2xl border p-4 transition-all ${
                w.storm_alert
                  ? 'border-amber-500/40 bg-gradient-to-b from-night-800 to-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'border-night-700 bg-night-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{w.zone} Sector</span>
                {w.storm_alert ? (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                    STORM ALERT
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Clear</span>
                )}
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="h-3.5 w-3.5 text-rose-400" /> Temp:
                  </span>
                  <span className="font-mono font-bold text-white">{w.ambient_temp_c}°C</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Wind className="h-3.5 w-3.5 text-cyan-400" /> Wind:
                  </span>
                  <span className="font-mono font-bold text-white">{w.wind_speed_kmh} km/h</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="h-3.5 w-3.5 text-blue-400" /> Rain:
                  </span>
                  <span className="font-mono font-bold text-white">{w.precipitation_mm} mm</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Feed */}
      <div className="rounded-2xl border border-night-700 bg-night-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Recent Physical & Electrical Grid Incidents
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{incidents.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-night-700 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Incident ID</th>
                <th className="pb-3 font-semibold">Asset</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Fault Classification</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-700/60">
              {incidents.slice(0, 6).map((inc) => (
                <tr key={inc.incident_id} className="hover:bg-night-700/30 transition-colors">
                  <td className="py-3 font-mono font-semibold text-cyan-400">{inc.incident_id}</td>
                  <td className="py-3 font-mono text-white hover:underline cursor-pointer" onClick={() => navigate(`/asset/${inc.asset_id}`)}>
                    {inc.asset_id}
                  </td>
                  <td className="py-3">
                    <RiskBadge level={inc.severity} size="sm" />
                  </td>
                  <td className="py-3 font-medium text-slate-200">{inc.incident_type}</td>
                  <td className="py-3 text-slate-400 max-w-md truncate">{inc.description}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        inc.status === 'Open'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : inc.status === 'Investigating'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
