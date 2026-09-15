import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Printer,
  Users,
  AlertOctagon,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { getOperatorBrief, getActionItems } from '../api/gridApi';
import { OperatorBrief, ActionItem, PriorityLevel } from '../types/grid';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const ActionPlan: React.FC = () => {
  const navigate = useNavigate();

  const [brief, setBrief] = useState<OperatorBrief | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionPlanData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [briefData, actionsData] = await Promise.all([
        getOperatorBrief(),
        getActionItems(),
      ]);
      setBrief(briefData);
      setActions(actionsData);
    } catch (err: unknown) {
      console.error(err);
      setError('Unable to load dispatcher action plan and crew schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlanData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !brief) {
    return <LoadingState message="Generating prioritized action plan & crew roster..." count={3} />;
  }

  if (error && !brief) {
    return <ErrorState message={error} onRetry={fetchActionPlanData} isRetrying={loading} />;
  }

  // Group actions by PriorityLevel: Immediate > Urgent > Medium > Routine
  const priorities: PriorityLevel[] = ['Immediate', 'Urgent', 'Medium', 'Routine'];
  const groupedActions = priorities.reduce((acc, p) => {
    acc[p] = actions.filter((a) => a.priority === p);
    return acc;
  }, {} as Record<PriorityLevel, ActionItem[]>);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls & Print Trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-cyan-400" />
            <span>Dispatcher Triage & Action Plan</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Automated equipment protection directives and field crew response coordination.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl bg-night-800 px-4 py-2.5 text-xs font-bold text-white border border-night-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all shadow-lg active:scale-95"
        >
          <Printer className="h-4 w-4 text-cyan-400" />
          <span>Download Operator Brief</span>
        </button>
      </div>

      {/* Printable Operator Brief Container */}
      <div id="operator-brief" className="space-y-6">
        {/* Executive Summary Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-night-900 via-night-800 to-night-900 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-night-700/60 gap-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                GridWatch Incident Command Center
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Official Shift Operator Intelligence Brief
              </h2>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>Brief Timestamp: {new Date(brief?.generated_at || '').toLocaleString()}</div>
              <div>Status: <span className="font-bold text-red-400">{brief?.grid_status}</span></div>
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
            {brief?.summary_text}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-night-700/60 text-xs">
            <div className="rounded-xl bg-night-900/60 p-3 border border-night-700">
              <span className="text-slate-400">Total Monitored:</span>
              <div className="font-mono text-lg font-bold text-white mt-1">{brief?.total_assets_monitored}</div>
            </div>
            <div className="rounded-xl bg-red-950/20 p-3 border border-red-500/30">
              <span className="text-red-400">Critical Alerts:</span>
              <div className="font-mono text-lg font-bold text-red-400 mt-1">{brief?.critical_risk_count}</div>
            </div>
            <div className="rounded-xl bg-orange-950/20 p-3 border border-orange-500/30">
              <span className="text-orange-400">High Risk Assets:</span>
              <div className="font-mono text-lg font-bold text-orange-400 mt-1">{brief?.high_risk_count}</div>
            </div>
            <div className="rounded-xl bg-emerald-950/20 p-3 border border-emerald-500/30">
              <span className="text-emerald-400">Nominal Operation:</span>
              <div className="font-mono text-lg font-bold text-emerald-400 mt-1">{brief?.low_risk_count}</div>
            </div>
          </div>
        </div>

        {/* Priority Action Directives Grouped by PriorityLevel */}
        <div className="space-y-5">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-cyan-400" />
            <span>Operational Directives (Immediate &rarr; Routine)</span>
          </h2>

          {priorities.map((pLevel) => {
            const items = groupedActions[pLevel] || [];
            if (items.length === 0) return null;

            const isImmediate = pLevel === 'Immediate';
            const isUrgent = pLevel === 'Urgent';

            return (
              <div key={pLevel} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                      isImmediate
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-critical-glow'
                        : isUrgent
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {pLevel} Priority ({items.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    {isImmediate
                      ? 'Requires immediate SCADA control action or emergency de-energization'
                      : 'Urgent diagnostic inspection required within 24 hours'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 bg-night-800 transition-all ${
                        isImmediate
                          ? 'border-red-500/40 bg-gradient-to-br from-night-800 via-night-800 to-red-950/20'
                          : 'border-night-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => navigate(`/asset/${item.asset_id}`)}
                            className="font-mono text-base font-extrabold text-cyan-400 hover:underline cursor-pointer"
                          >
                            {item.asset_id}
                          </span>
                          <RiskBadge level={item.risk_level} size="sm" />
                        </div>

                        {item.deadline_hours && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3" />
                            <span>Deadline: &le;{item.deadline_hours.toFixed(1)}h</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5">
                        <div className="text-xs font-bold text-white leading-snug">
                          {item.action}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {item.reason}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-night-700/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">Protocol: IEC 60076 Protection Matrix</span>
                        <button
                          onClick={() => navigate(`/asset/${item.asset_id}`)}
                          className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <span>Asset Telemetry</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Crew Deployments Roster */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <span>Field Crew Dispatch Schedule ({brief?.crew_deployments?.length || 0})</span>
            </h2>
            <span className="text-xs text-slate-400">Synchronized with active maintenance orders</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {brief?.crew_deployments?.map((crew, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-night-700 bg-night-800 p-4 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-night-700/60 px-2 py-0.5 rounded border border-night-600">
                      {crew.crew_id}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        crew.priority === 'Immediate'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {crew.priority}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-bold text-white">
                    Target: <span className="font-mono text-cyan-400 hover:underline cursor-pointer" onClick={() => navigate(`/asset/${crew.target_asset_id}`)}>{crew.target_asset_id}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    {crew.task_description}
                  </p>
                </div>

                <div className="pt-2 border-t border-night-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Duration: <strong className="text-slate-200">{crew.estimated_duration_hours}h</strong></span>
                  <span>ETD: <strong className="text-slate-200">{new Date(crew.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
