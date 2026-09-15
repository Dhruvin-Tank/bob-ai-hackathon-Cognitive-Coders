export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type GridStatus = 'NOMINAL' | 'ELEVATED_RISK' | 'CRITICAL_ALERT';
export type PriorityLevel = 'Immediate' | 'Urgent' | 'Medium' | 'Routine';

export interface AssetWithRisk {
  asset_id: string;
  name: string;
  asset_type: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central';
  status: string;
  rated_capacity_mva: number;
  failure_probability: number; // 0 to 1
  risk_level: RiskLevel;
  health_score: number; // 0 to 100
  primary_risk_factor: string;
  recommended_action: string;
  last_updated: string;
}

export interface SensorReading {
  id?: number;
  asset_id?: string;
  timestamp: string;
  voltage_kv: number;
  current_a: number;
  temperature_c: number;
  vibration_hz: number;
  power_factor: number;
  oil_temp_c: number | null;
  load_pct: number;
}

export interface Incident {
  id?: number;
  incident_id: string;
  asset_id: string;
  timestamp: string;
  severity: RiskLevel;
  incident_type: string;
  description: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  resolved_at: string | null;
}

export interface MaintenancePlan {
  id?: number;
  plan_id: string;
  asset_id: string;
  scheduled_date: string;
  crew_id: string;
  priority: PriorityLevel;
  estimated_duration_hours: number;
  description: string;
  parts_required?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface ActionItem {
  asset_id: string;
  priority: PriorityLevel;
  risk_level: RiskLevel;
  action: string;
  reason: string;
  deadline_hours: number | null;
}

export interface CrewDeployment {
  crew_id: string;
  target_asset_id: string;
  priority: PriorityLevel;
  task_description: string;
  estimated_duration_hours: number;
  scheduled_time: string;
}

export interface OperatorBrief {
  generated_at: string;
  grid_status: GridStatus;
  total_assets_monitored: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  action_items: ActionItem[];
  crew_deployments: CrewDeployment[];
  summary_text: string;
}

export interface WeatherData {
  id?: number;
  zone: string;
  timestamp: string;
  ambient_temp_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  solar_irradiance_wm2: number;
  storm_alert: boolean;
}

export interface RiskPrediction {
  id: number;
  asset_id: string;
  timestamp: string;
  failure_probability: number;
  risk_level: RiskLevel;
  health_score: number;
  primary_risk_factor: string;
  recommended_action: string;
  time_to_failure_hours?: number | null;
  confidence_score: number;
}

export interface AssetDetail {
  asset: {
    id: number;
    asset_id: string;
    name: string;
    asset_type: string;
    latitude: number;
    longitude: number;
    zone: 'North' | 'South' | 'East' | 'West' | 'Central';
    installation_date: string;
    rated_capacity_mva: number;
    status: string;
    created_at: string;
  };
  latest_sensor_reading?: SensorReading;
  latest_risk_prediction?: RiskPrediction;
  recent_incidents: Incident[];
  maintenance_plans: MaintenancePlan[];
}
