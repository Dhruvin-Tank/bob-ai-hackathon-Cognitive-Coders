import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowLeft,
  BrainCircuit,
  Activity,
  AlertTriangle,
  Clock,
  Gauge,
  Thermometer,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { getAssetDetail, getSensorHistory } from '../api/gridApi';
import { AssetDetail as IAssetDetail, SensorReading } from '../types/grid';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<IAssetDetail | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const assetId = id || 'TX-114';

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [detailData, historyData] = await Promise.all([
        getAssetDetail(assetId),
        getSensorHistory(assetId, 100),
      ]);
      setDetail(detailData);
      
      // CRITICAL RULE: History arrives latest-first; reverse to ascending chronological order for charts!
      const chronologicalHistory = [...historyData].reverse();
      setHistory(chronologicalHistory);
    } catch (err: unknown) {
      console.error(err);
      setError(`Failed to fetch telemetry details for asset ${assetId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetData();
  }, [assetId]);

  if (loading && !detail) {
    return <LoadingState message={`Fetching telemetry stream for ${assetId}...`} count={4} />;
  }

  if (error && !detail) {
    return <ErrorState message={error} onRetry={fetchAssetData} isRetrying={loading} />;
  }

  const asset = detail?.asset;
  const reading = detail?.latest_sensor_reading;
  const prediction = detail?.latest_risk_prediction;
  const healthScore = prediction?.health_score ?? 85.0;
  const isCritical = prediction?.risk_level === 'Critical';

  // Format chart time labels
  const chartData = history.map((item) => {
    const d = new Date(item.timestamp);
    return {
      ...item,
      timeLabel: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
    };
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/fleet')}
          className="inline-flex items-center gap-2 rounded-xl bg-night-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-night-700 hover:text-white hover:border-night-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fleet</span>
        </button>

        {/* Hero demo quick-selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Quick Switch Demo:</span>
          {['TX-114', 'TX-107', 'TX-119', 'TX-101'].map((demoId) => (
            <button
              key={demoId}
              onClick={() => navigate(`/asset/${demoId}`)}
              className={`rounded-lg px-2 py-1 font-mono font-bold transition-all ${
                assetId === demoId
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-volt-glow'
                  : 'bg-night-800 text-slate-400 border border-night-700 hover:text-white'
              }`}
            >
              {demoId}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Header Card */}
      <div className={`rounded-2xl border p-6 bg-night-800 transition-all ${
        isCritical
          ? 'border-red-500/40 bg-gradient-to-r from-red-950/30 via-night-800 to-night-800 shadow-critical-glow'
          : 'border-night-700'
      }`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl md:text-3xl font-extrabold tracking-tight text-cyan-400">
                {asset?.asset_id}
              </span>
              <RiskBadge level={prediction?.risk_level || 'Low'} size="md" />
              <span className="rounded-full bg-night-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {asset?.status}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white mt-1.5">
              {asset?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <span>Type: <strong className="text-white">{asset?.asset_type}</strong></span>
              <span>•</span>
              <span>Sector: <strong className="text-white">{asset?.zone}</strong></span>
              <span>•</span>
              <span>Rated Capacity: <strong className="text-white">{asset?.rated_capacity_mva} MVA</strong></span>
              <span>•</span>
              <span>Commissioned: <strong className="text-white">{new Date(asset?.installation_date || '').toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Quick Health Gauge Scorecard */}
          <div className="flex items-center gap-4 rounded-xl border border-night-700/80 bg-night-900/80 p-4 shrink-0">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Index (AHI)</div>
              <div className="font-mono text-3xl font-extrabold text-white">{healthScore}%</div>
              <div className="text-[10px] text-slate-500">Confidence: {((prediction?.confidence_score ?? 0.9) * 100).toFixed(0)}%</div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-night-700 flex items-center justify-center relative">
              <div
                className={`h-full w-full rounded-full border-4 ${
                  healthScore <= 35
                    ? 'border-red-500 shadow-[0_0_12px_#ef4444]'
                    : healthScore <= 60
                    ? 'border-orange-500'
                    : healthScore <= 78
                    ? 'border-amber-500'
                    : 'border-emerald-500'
                }`}
                style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oil Temp</span>
            <Thermometer className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.oil_temp_c ?? '--'}°C
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 85°C</div>
        </div>

        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operating Load</span>
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.load_pct ?? '--'}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Peak Cap: 100%</div>
        </div>

        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bus Voltage</span>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.voltage_kv ?? '--'} kV
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Nominal: 138 kV</div>
        </div>

        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Core Vibration</span>
            <Activity className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.vibration_hz ?? '--'} Hz
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Baseline: 2.0 Hz</div>
        </div>

        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Power Factor</span>
            <Gauge className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.power_factor ?? '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: &ge; 0.95</div>
        </div>

        <div className="rounded-2xl border border-night-700 bg-night-800 p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Winding Temp</span>
            <Thermometer className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-white">
            {reading?.temperature_c ?? '--'}°C
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ambient + Dissipation</div>
        </div>
      </div>

      {/* AI Explanation & Natural Language Risk Panel */}
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 via-night-800 to-night-800 p-6 shadow-volt-glow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-volt-glow">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-700/60 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Failure Diagnostic & Predictive Advice</span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono text-cyan-400">
                  Model Confidence: {((prediction?.confidence_score ?? 0.94) * 100).toFixed(0)}%
                </span>
              </h2>
              {prediction?.time_to_failure_hours && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Est. Time to Failure: {prediction.time_to_failure_hours} hrs</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-night-700/80 bg-night-900/60 p-3.5 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Identified Primary Risk Driver
                </div>
                <p className="text-sm font-bold text-white">
                  {prediction?.primary_risk_factor}
                </p>
                <p className="text-slate-400 text-[11px] pt-1">
                  Telemetry indicates thermal and electrical limits exceeded standard IEC 60076 loading tolerances.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-night-900/60 p-3.5 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold">
                  Dispatcher Recommended Directive
                </div>
                <p className="text-sm font-semibold text-cyan-200">
                  {prediction?.recommended_action}
                </p>
                <p className="text-slate-400 text-[11px] pt-1">
                  Work order automatically drafted and transmitted to field operations dispatch queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Recharts Time-Series Charts (Reversed to chronological ascending) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span>30-Day Chronological Telemetry Timeseries (Oldest &rarr; Newest)</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. Oil Temperature Chart */}
          <div className="rounded-2xl border border-night-700 bg-night-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-rose-400" /> Top Oil Temperature (°C)
              </span>
              <span className="text-xs font-mono text-rose-400 font-bold">Max: 106°C</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="oilGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101828', borderColor: '#253147', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="oil_temp_c" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#oilGrad)" name="Oil Temp (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Load Percentage Chart */}
          <div className="rounded-2xl border border-night-700 bg-night-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-400" /> Transformer Load (%)
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">Threshold: 85%</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[30, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101828', borderColor: '#253147', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="load_pct" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#loadGrad)" name="Load (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Voltage Fluctuation Chart */}
          <div className="rounded-2xl border border-night-700 bg-night-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" /> Bus Voltage (kV)
              </span>
              <span className="text-xs font-mono text-slate-400">Nominal 138 kV</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101828', borderColor: '#253147', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="voltage_kv" stroke="#f59e0b" strokeWidth={2} dot={false} name="Voltage (kV)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Core Mechanical Vibration Chart */}
          <div className="rounded-2xl border border-night-700 bg-night-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-purple-400" /> Vibration Telemetry (Hz)
              </span>
              <span className="text-xs font-mono text-purple-400 font-bold">Limit: 4.5 Hz</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[1, 10]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101828', borderColor: '#253147', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="vibration_hz" stroke="#a855f7" strokeWidth={2} dot={false} name="Vibration (Hz)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents & Maintenance Work Orders Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Incidents for Asset */}
        <div className="rounded-2xl border border-night-700 bg-night-800 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-night-700/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Fault History ({detail?.recent_incidents?.length || 0})</span>
            </h3>
            <span className="text-xs text-slate-400">Past 30 Days</span>
          </div>

          {detail?.recent_incidents && detail.recent_incidents.length > 0 ? (
            <div className="space-y-2.5">
              {detail.recent_incidents.map((inc) => (
                <div key={inc.incident_id} className="p-3 rounded-xl border border-night-700 bg-night-900/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{inc.incident_id}</span>
                    <RiskBadge level={inc.severity} size="sm" />
                  </div>
                  <div className="text-xs font-semibold text-white">{inc.incident_type}</div>
                  <p className="text-[11px] text-slate-400">{inc.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>Logged: {new Date(inc.timestamp).toLocaleString()}</span>
                    <span className="font-semibold text-slate-400">Status: {inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No active or past incidents logged for this asset.</p>
          )}
        </div>

        {/* Maintenance Work Orders */}
        <div className="rounded-2xl border border-night-700 bg-night-800 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-night-700/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cyan-400" />
              <span>Maintenance Orders ({detail?.maintenance_plans?.length || 0})</span>
            </h3>
            <span className="text-xs text-slate-400">Field Dispatches</span>
          </div>

          {detail?.maintenance_plans && detail.maintenance_plans.length > 0 ? (
            <div className="space-y-2.5">
              {detail.maintenance_plans.map((plan) => (
                <div key={plan.plan_id} className="p-3 rounded-xl border border-night-700 bg-night-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{plan.plan_id}</span>
                    <span className="rounded bg-night-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {plan.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200">{plan.description}</p>
                  <div className="text-[11px] text-slate-400">
                    Parts: <strong className="text-slate-300">{plan.parts_required || 'Standard repair kit'}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-night-700/40 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>Est: {plan.estimated_duration_hours}h</span>
                    </span>
                    <span className="font-mono text-cyan-400">Crew: {plan.crew_id}</span>
                    <span className="font-semibold text-emerald-400">{plan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No maintenance work orders scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
};
