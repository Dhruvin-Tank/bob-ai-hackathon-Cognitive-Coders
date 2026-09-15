import { apiClient } from './client';
import {
  ActionItem,
  AssetDetail,
  AssetWithRisk,
  Incident,
  OperatorBrief,
  RiskPrediction,
  SensorReading,
  WeatherData,
} from '../types/grid';

/**
 * GridWatch Typed API Service
 * Interacts directly with the FastAPI risk intelligence engine
 */

// 1. GET /api/action-plan/brief
export const getOperatorBrief = async (): Promise<OperatorBrief> => {
  const { data } = await apiClient.get<OperatorBrief>('/api/action-plan/brief');
  return data;
};

// 2 & 3. GET /api/assets & GET /api/assets?zone=...&status=...
export const getAssets = async (zone?: string, status?: string): Promise<AssetWithRisk[]> => {
  const params: Record<string, string> = {};
  if (zone && zone !== 'All') params.zone = zone;
  if (status && status !== 'All') params.status = status;
  
  const { data } = await apiClient.get<AssetWithRisk[]>('/api/assets', { params });
  return data;
};

// 4. GET /api/assets/{asset_id}
export const getAssetDetail = async (assetId: string): Promise<AssetDetail> => {
  const { data } = await apiClient.get<AssetDetail>(`/api/assets/${assetId}`);
  return data;
};

// 5. GET /api/sensors/{asset_id}/history?limit=100
export const getSensorHistory = async (assetId: string, limit = 100): Promise<SensorReading[]> => {
  const { data } = await apiClient.get<SensorReading[]>(`/api/sensors/${assetId}/history`, {
    params: { limit },
  });
  return data;
};

// 6. POST /api/predictions/run
export const runPredictions = async (): Promise<RiskPrediction[]> => {
  const { data } = await apiClient.post<RiskPrediction[]>('/api/predictions/run');
  return data;
};

// 7. GET /api/weather/current
export const getCurrentWeather = async (): Promise<WeatherData[]> => {
  const { data } = await apiClient.get<WeatherData[]>('/api/weather/current');
  return data;
};

// 8. GET /api/incidents
export const getIncidents = async (
  assetId?: string,
  severity?: string,
  status?: string
): Promise<Incident[]> => {
  const params: Record<string, string> = {};
  if (assetId) params.asset_id = assetId;
  if (severity && severity !== 'All') params.severity = severity;
  if (status && status !== 'All') params.status = status;

  const { data } = await apiClient.get<Incident[]>('/api/incidents', { params });
  return data;
};

// GET /api/action-plan/actions
export const getActionItems = async (): Promise<ActionItem[]> => {
  const { data } = await apiClient.get<ActionItem[]>('/api/action-plan/actions');
  return data;
};
