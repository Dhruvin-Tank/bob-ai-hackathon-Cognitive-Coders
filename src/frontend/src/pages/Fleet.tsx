import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rows3,
  ArrowUpDown,
  Search,
  ArrowRight,
} from 'lucide-react';

import { getAssets } from '../api/gridApi';
import { AssetWithRisk } from '../types/grid';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

type SortField = 'asset_id' | 'name' | 'zone' | 'health_score' | 'failure_probability' | 'rated_capacity_mva';

export const Fleet: React.FC = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState<AssetWithRisk[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('health_score');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAssets(selectedZone !== 'All' ? selectedZone : undefined);
      setAssets(data);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to fetch grid asset registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [selectedZone]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAssets = assets
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      return (
        a.asset_id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.asset_type.toLowerCase().includes(q) ||
        a.zone.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      valA = valA ?? 0;
      valB = valB ?? 0;
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Rows3 className="h-6 w-6 text-cyan-400" />
            <span>Power Grid Asset Fleet</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            20 monitored transmission, substation, and distribution transformers across all sectors.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-night-700 bg-night-800 pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'North', 'South', 'East', 'West', 'Central'].map((zone) => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedZone === zone
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-volt-glow'
                : 'bg-night-800 text-slate-400 border border-night-700 hover:text-white'
            }`}
          >
            {zone === 'All' ? 'All Sectors' : `${zone} Sector`}
          </button>
        ))}
      </div>

      {/* Table Container */}
      {loading ? (
        <LoadingState message="Fetching transformer fleet registry..." count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFleet} isRetrying={loading} />
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          title="No Grid Assets Found"
          description="No transformers matched your current search and zone filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedZone('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="rounded-2xl border border-night-700 bg-night-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-night-700 bg-night-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('asset_id')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Asset ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Descriptor</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('zone')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Sector</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('rated_capacity_mva')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capacity</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('health_score')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Health Index</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('failure_probability')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Failure Prob</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Risk Severity</th>
                  <th className="py-3.5 px-4">Primary Risk Factor</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-700/60">
                {filteredAssets.map((asset) => {
                  const isCritical = asset.risk_level === 'Critical';
                  const health = asset.health_score;

                  return (
                    <tr
                      key={asset.asset_id}
                      onClick={() => navigate(`/asset/${asset.asset_id}`)}
                      className={`cursor-pointer transition-colors ${
                        isCritical
                          ? 'bg-red-950/15 hover:bg-red-950/30'
                          : 'hover:bg-night-700/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {asset.asset_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{asset.name}</div>
                        <div className="text-[11px] text-slate-400">{asset.asset_type}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {asset.zone}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {asset.rated_capacity_mva} MVA
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white w-10">
                            {health}%
                          </span>
                          {/* Mini Progress Bar Gauge */}
                          <div className="h-2 w-20 rounded-full bg-night-900 overflow-hidden border border-night-700">
                            <div
                              className={`h-full rounded-full ${
                                health <= 35
                                  ? 'bg-red-500'
                                  : health <= 60
                                  ? 'bg-orange-500'
                                  : health <= 78
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, health)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        <span
                          className={
                            asset.failure_probability >= 0.65
                              ? 'text-red-400 font-bold'
                              : asset.failure_probability >= 0.4
                              ? 'text-orange-400'
                              : 'text-slate-300'
                          }
                        >
                          {(asset.failure_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge level={asset.risk_level} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {asset.primary_risk_factor}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/asset/${asset.asset_id}`);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
