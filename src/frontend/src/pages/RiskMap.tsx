import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import {
  Compass,
  ArrowRight,
  Flame,
  Layers,
} from 'lucide-react';

import { getAssets, getAssetDetail } from '../api/gridApi';
import { AssetWithRisk, RiskLevel } from '../types/grid';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

interface AssetWithCoords extends AssetWithRisk {
  latitude: number;
  longitude: number;
}

// Helper to pan/zoom map on zone change
const MapViewUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const RiskMap: React.FC = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState<AssetWithCoords[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');

  const [mapCenter, setMapCenter] = useState<[number, number]>([32.7767, -96.7970]); // Texas Grid Center
  const [mapZoom, setMapZoom] = useState<number>(8);

  const zoneCenters: Record<string, { center: [number, number]; zoom: number }> = {
    All: { center: [32.7767, -96.7970], zoom: 8 },
    North: { center: [33.35, -96.80], zoom: 9 },
    South: { center: [32.10, -96.80], zoom: 9 },
    East: { center: [32.80, -96.10], zoom: 9 },
    West: { center: [32.80, -97.45], zoom: 9 },
    Central: { center: [32.77, -96.79], zoom: 10 },
  };

  const fetchMapAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const rawAssets = await getAssets();
      
      // Fetch coordinates via asset detail for all 20 assets
      const enrichedAssets: AssetWithCoords[] = await Promise.all(
        rawAssets.map(async (asset) => {
          try {
            const detail = await getAssetDetail(asset.asset_id);
            return {
              ...asset,
              latitude: detail.asset.latitude,
              longitude: detail.asset.longitude,
            };
          } catch {
            // Fallback coordinate offset
            return {
              ...asset,
              latitude: 32.7767,
              longitude: -96.7970,
            };
          }
        })
      );

      setAssets(enrichedAssets);
    } catch (err: unknown) {
      console.error(err);
      setError('Unable to load asset geolocation telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapAssets();
  }, []);

  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    if (zoneCenters[zone]) {
      setMapCenter(zoneCenters[zone].center);
      setMapZoom(zoneCenters[zone].zoom);
    }
  };

  const getRiskColor = (risk: RiskLevel | string) => {
    switch (risk) {
      case 'Critical':
        return '#ef4444';
      case 'High':
        return '#f97316';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
      default:
        return '#22c55e';
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesZone = selectedZone === 'All' || asset.zone === selectedZone;
    const matchesRisk = selectedRisk === 'All' || asset.risk_level === selectedRisk;
    return matchesZone && matchesRisk;
  });

  if (loading) {
    return <LoadingState message="Plotting high-voltage substations & risk topology..." count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchMapAssets} isRetrying={loading} />;
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="h-6 w-6 text-cyan-400" />
            <span>Grid Geospatial Risk Topology</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Geographical distribution of 20 high-voltage transformer assets colored by live risk severity.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-night-800 p-1 border border-night-700">
            {['All', 'North', 'South', 'East', 'West', 'Central'].map((zone) => (
              <button
                key={zone}
                onClick={() => handleZoneChange(zone)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedZone === zone
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-volt-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>

          {/* Risk Tier Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="rounded-xl border border-night-700 bg-night-800 px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Risk Tiers</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Map Card */}
      <div className="relative h-[650px] w-full rounded-2xl border border-night-700 bg-night-900 overflow-hidden shadow-2xl">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <MapViewUpdater center={mapCenter} zoom={mapZoom} />

          {/* Dark CARTO Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render CircleMarkers for each asset */}
          {filteredAssets.map((asset) => {
            const isTargetCritical = asset.asset_id === 'TX-114';
            const color = getRiskColor(asset.risk_level);

            return (
              <CircleMarker
                key={asset.asset_id}
                center={[asset.latitude, asset.longitude]}
                radius={isTargetCritical ? 14 : 10}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: isTargetCritical ? '#ffffff' : color,
                  weight: isTargetCritical ? 3 : 1.5,
                }}
              >
                {/* Hover Tooltip */}
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <span className="font-mono text-xs">{asset.asset_id}</span> • {asset.risk_level}
                </Tooltip>

                {/* Click Popup with Details & Deep Link */}
                <Popup>
                  <div className="p-1 text-slate-100 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 border-b border-night-700 pb-2 mb-2">
                      <span className="font-mono font-bold text-sm text-cyan-400">
                        {asset.asset_id}
                      </span>
                      <RiskBadge level={asset.risk_level} size="sm" />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="font-medium text-slate-200">{asset.name}</div>
                      <div className="text-slate-400">Sector: <strong className="text-white">{asset.zone}</strong></div>
                      
                      <div className="flex items-center justify-between pt-1 text-slate-300">
                        <span>Health Score:</span>
                        <strong className="font-mono text-white">{asset.health_score}%</strong>
                      </div>
                      
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Failure Probability:</span>
                        <strong className="font-mono text-red-400">
                          {(asset.failure_probability * 100).toFixed(1)}%
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-night-700/60">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Primary Stress Driver</div>
                        <div className="text-slate-300 text-[11px] leading-tight mt-0.5">{asset.primary_risk_factor}</div>
                      </div>

                      <button
                        onClick={() => navigate(`/asset/${asset.asset_id}`)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500/20 py-1.5 text-xs font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                      >
                        <span>Open Telemetry Console</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-5 right-5 z-[1000] rounded-xl border border-night-700 bg-night-900/90 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Risk Level Legend</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span>Critical Risk (AHI &le; 35%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-orange-500" />
              <span>High Risk (AHI &le; 60%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Medium Wear (AHI &le; 78%)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Nominal Operating Baseline</span>
            </div>
          </div>
        </div>

        {/* Spotlight Warning for TX-114 */}
        <div className="absolute top-5 left-5 z-[1000] rounded-xl border border-red-500/40 bg-night-900/90 p-3 shadow-critical-glow backdrop-blur-md max-w-xs">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
            <Flame className="h-4 w-4 animate-pulse" />
            <span>Active Outage Alert: TX-114</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Top oil temperature &gt;104°C in North Sector. Dispatcher intervention active.
          </p>
        </div>
      </div>
    </div>
  );
};
