from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# 1. Asset Schemas
# ---------------------------------------------------------------------------
class AssetBase(BaseModel):
    asset_id: str = Field(..., description="Unique alphanumeric identifier (e.g., TX-101)")
    name: str = Field(..., description="Human-readable asset descriptor")
    asset_type: str = Field(..., description="Classification: Transformer, Substation, Feeder Line")
    latitude: float = Field(..., description="Geographical latitude coordinate")
    longitude: float = Field(..., description="Geographical longitude coordinate")
    zone: str = Field(..., description="Grid zone assignment (North, South, East, West, Central)")
    installation_date: datetime = Field(..., description="Asset commissioning timestamp")
    rated_capacity_mva: float = Field(..., description="Rated power capacity in MVA")
    status: str = Field("Operational", description="Current operating state")


class AssetCreate(AssetBase):
    pass


class AssetOut(AssetBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 2. Sensor Reading Schemas
# ---------------------------------------------------------------------------
class SensorReadingBase(BaseModel):
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    voltage_kv: float
    current_a: float
    temperature_c: float
    vibration_hz: float
    power_factor: float
    oil_temp_c: Optional[float] = None
    load_pct: float


class SensorReadingCreate(SensorReadingBase):
    pass


class SensorReadingOut(SensorReadingBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 3. Weather Data Schemas
# ---------------------------------------------------------------------------
class WeatherDataBase(BaseModel):
    zone: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ambient_temp_c: float
    humidity_pct: float
    wind_speed_kmh: float
    precipitation_mm: float
    solar_irradiance_wm2: float
    storm_alert: bool = False


class WeatherDataCreate(WeatherDataBase):
    pass


class WeatherDataOut(WeatherDataBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 4. Incident Schemas
# ---------------------------------------------------------------------------
class IncidentBase(BaseModel):
    incident_id: str
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str  # Critical, High, Medium, Low
    incident_type: str
    description: str
    status: str = "Open"
    resolved_at: Optional[datetime] = None


class IncidentCreate(IncidentBase):
    pass


class IncidentOut(IncidentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 5. Maintenance Plan Schemas
# ---------------------------------------------------------------------------
class MaintenancePlanBase(BaseModel):
    plan_id: str
    asset_id: str
    scheduled_date: datetime
    crew_id: str
    priority: str  # Immediate, Urgent, High, Routine
    estimated_duration_hours: float
    description: str
    parts_required: Optional[str] = None
    status: str = "Pending"


class MaintenancePlanCreate(MaintenancePlanBase):
    pass


class MaintenancePlanOut(MaintenancePlanBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 6. Risk Prediction Schemas
# ---------------------------------------------------------------------------
class RiskPredictionBase(BaseModel):
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    failure_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # Critical, High, Medium, Low
    health_score: float = Field(..., ge=0.0, le=100.0)
    primary_risk_factor: str
    recommended_action: str
    time_to_failure_hours: Optional[float] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class RiskPredictionCreate(RiskPredictionBase):
    pass


class RiskPredictionOut(RiskPredictionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Composite & Specialized Output Types
# ---------------------------------------------------------------------------
class AssetDetailOut(BaseModel):
    asset: AssetOut
    latest_sensor_reading: Optional[SensorReadingOut] = None
    latest_risk_prediction: Optional[RiskPredictionOut] = None
    recent_incidents: List[IncidentOut] = []
    maintenance_plans: List[MaintenancePlanOut] = []

    model_config = ConfigDict(from_attributes=True)


class AssetWithRiskOut(BaseModel):
    asset_id: str
    name: str
    asset_type: str
    zone: str
    status: str
    rated_capacity_mva: float
    failure_probability: float
    risk_level: str  # Critical, High, Medium, Low
    health_score: float
    primary_risk_factor: str
    recommended_action: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class ActionItemOut(BaseModel):
    asset_id: str
    priority: str  # Immediate, Urgent, High, Routine
    risk_level: str
    action: str
    reason: str
    deadline_hours: Optional[float] = None


class CrewDeploymentOut(BaseModel):
    crew_id: str
    target_asset_id: str
    priority: str
    task_description: str
    estimated_duration_hours: float
    scheduled_time: datetime


class OperatorBriefOut(BaseModel):
    generated_at: datetime
    grid_status: str  # NOMINAL, ELEVATED_RISK, CRITICAL_ALERT
    total_assets_monitored: int
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    action_items: List[ActionItemOut]
    crew_deployments: List[CrewDeploymentOut]
    summary_text: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
