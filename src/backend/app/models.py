from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)  # Transformer, Substation, Feeder Line
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone = Column(String, index=True, nullable=False)  # North, South, East, West, Central
    installation_date = Column(DateTime, nullable=False)
    rated_capacity_mva = Column(Float, nullable=False)
    status = Column(String, default="Operational")  # Operational, Degraded, Critical, Offline
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sensor_readings = relationship("SensorReading", back_populates="asset", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="asset", cascade="all, delete-orphan")
    maintenance_plans = relationship("MaintenancePlan", back_populates="asset", cascade="all, delete-orphan")
    risk_predictions = relationship("RiskPrediction", back_populates="asset", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.asset_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    voltage_kv = Column(Float, nullable=False)
    current_a = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    vibration_hz = Column(Float, nullable=False)
    power_factor = Column(Float, nullable=False)
    oil_temp_c = Column(Float, nullable=True)
    load_pct = Column(Float, nullable=False)

    asset = relationship("Asset", back_populates="sensor_readings")


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    zone = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    ambient_temp_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    precipitation_mm = Column(Float, nullable=False)
    solar_irradiance_wm2 = Column(Float, nullable=False)
    storm_alert = Column(Boolean, default=False, nullable=False)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True, nullable=False)
    asset_id = Column(String, ForeignKey("assets.asset_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    severity = Column(String, nullable=False)  # Critical, High, Medium, Low
    incident_type = Column(String, nullable=False)  # Thermal Runaway, Insulation Breakdown, Vibration Anomaly, Voltage Spike, Storm Damage
    description = Column(Text, nullable=False)
    status = Column(String, default="Open", nullable=False)  # Open, Investigating, Mitigated, Resolved
    resolved_at = Column(DateTime, nullable=True)

    asset = relationship("Asset", back_populates="incidents")


class MaintenancePlan(Base):
    __tablename__ = "maintenance_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, unique=True, index=True, nullable=False)
    asset_id = Column(String, ForeignKey("assets.asset_id"), index=True, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    crew_id = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # Immediate, Urgent, High, Routine
    estimated_duration_hours = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    parts_required = Column(Text, nullable=True)
    status = Column(String, default="Pending", nullable=False)  # Pending, In Progress, Completed, Deferred

    asset = relationship("Asset", back_populates="maintenance_plans")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.asset_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    failure_probability = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_level = Column(String, nullable=False)  # Critical, High, Medium, Low
    health_score = Column(Float, nullable=False)  # 0.0 to 100.0
    primary_risk_factor = Column(String, nullable=False)
    recommended_action = Column(Text, nullable=False)
    time_to_failure_hours = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0

    asset = relationship("Asset", back_populates="risk_predictions")
