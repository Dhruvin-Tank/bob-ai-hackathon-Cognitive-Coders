from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models import Asset, Incident, RiskPrediction, SensorReading, WeatherData


# ---------------------------------------------------------------------------
# 5 HELPER FUNCTIONS FOR RISK & HEALTH SCORING
# ---------------------------------------------------------------------------
def calculate_thermal_stress(
    load_pct: float, oil_temp_c: Optional[float], ambient_temp_c: float
) -> float:
    """Computes normalized thermal stress index (0.0 to 1.0) based on load,
    winding/oil temperatures, and heat dissipation limits."""
    effective_oil_temp = oil_temp_c if oil_temp_c is not None else (ambient_temp_c + (load_pct * 0.5))
    
    # Baselined: Oil temp > 65C begins stress; > 95C is extreme critical stress
    temp_factor = max(0.0, min(1.0, (effective_oil_temp - 50.0) / 50.0))
    # Load factor: Load > 75% begins exponential heat buildup
    load_factor = max(0.0, min(1.0, (load_pct - 50.0) / 60.0))
    # Ambient penalty: High ambient ambient temperature restricts cooling
    ambient_penalty = max(0.0, min(0.2, (ambient_temp_c - 30.0) / 50.0))

    stress = (temp_factor * 0.55) + (load_factor * 0.35) + ambient_penalty
    return round(max(0.0, min(1.0, stress)), 4)


def calculate_electrical_stress(
    voltage_kv: float, power_factor: float, nominal_voltage_kv: float = 138.0
) -> float:
    """Computes electrical stress (0.0 to 1.0) from over/under voltage fluctuations
    and reactive power distortion (power factor penalty)."""
    deviation_pct = abs(voltage_kv - nominal_voltage_kv) / nominal_voltage_kv
    volt_stress = max(0.0, min(1.0, deviation_pct / 0.15))  # 15% voltage deviation is max stress

    # Power factor < 0.95 increases losses; < 0.80 causes severe winding heating
    pf_penalty = max(0.0, min(1.0, (0.95 - power_factor) / 0.25)) if power_factor < 0.95 else 0.0

    stress = (volt_stress * 0.6) + (pf_penalty * 0.4)
    return round(max(0.0, min(1.0, stress)), 4)


def calculate_mechanical_stress(
    vibration_hz: float, baseline_hz: float = 2.0
) -> float:
    """Computes mechanical core/winding stress (0.0 to 1.0) from vibration deviations."""
    if vibration_hz <= baseline_hz:
        return 0.05
    # Vibration > 4.5 Hz indicates core looseness; > 8.0 Hz indicates impending mechanical failure
    excess = vibration_hz - baseline_hz
    stress = max(0.0, min(1.0, excess / 6.0))
    return round(stress, 4)


def calculate_environmental_stress(
    wind_speed_kmh: float, precipitation_mm: float, storm_alert: bool
) -> float:
    """Computes external environmental stress index (0.0 to 1.0)."""
    wind_stress = max(0.0, min(0.4, (wind_speed_kmh - 30.0) / 80.0)) if wind_speed_kmh > 30.0 else 0.0
    rain_stress = max(0.0, min(0.3, precipitation_mm / 50.0))
    storm_penalty = 0.35 if storm_alert else 0.0

    stress = wind_stress + rain_stress + storm_penalty
    return round(max(0.0, min(1.0, stress)), 4)


def calculate_health_score(
    thermal_stress: float,
    electrical_stress: float,
    mechanical_stress: float,
    environmental_stress: float,
    open_incidents_count: int,
    age_years: float,
) -> float:
    """Combines stress dimensions into standard 0.0 - 100.0 Asset Health Index (AHI).
    100.0 represents pristine operating condition; <= 35.0 is critical distress."""
    deductions = (
        (thermal_stress * 35.0)
        + (electrical_stress * 25.0)
        + (mechanical_stress * 20.0)
        + (environmental_stress * 10.0)
        + min(25.0, open_incidents_count * 12.0)
        + min(10.0, max(0.0, age_years * 0.4))
    )
    health = max(5.0, min(100.0, 100.0 - deductions))
    return round(health, 2)


# ---------------------------------------------------------------------------
# PRIMARY PREDICTION ENGINES
# ---------------------------------------------------------------------------
def compute_risk_for_asset(db: Session, asset_id: str) -> RiskPrediction:
    """Calculates real-time risk assessment, failure probability, and time-to-failure
    for a specific asset based on live telemetry, environmental conditions, and history."""
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise ValueError(f"Asset {asset_id} not found.")

    # 1. Gather latest sensor reading
    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.asset_id == asset_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    # 2. Gather latest weather for asset's zone
    latest_weather = (
        db.query(WeatherData)
        .filter(WeatherData.zone == asset.zone)
        .order_by(WeatherData.timestamp.desc())
        .first()
    )

    # Default fallback values if telemetry not yet populated
    load_pct = latest_reading.load_pct if latest_reading else 50.0
    oil_temp_c = latest_reading.oil_temp_c if latest_reading else 60.0
    voltage_kv = latest_reading.voltage_kv if latest_reading else 138.0
    power_factor = latest_reading.power_factor if latest_reading else 0.96
    vibration_hz = latest_reading.vibration_hz if latest_reading else 2.1

    ambient_temp_c = latest_weather.ambient_temp_c if latest_weather else 25.0
    wind_speed = latest_weather.wind_speed_kmh if latest_weather else 15.0
    precip = latest_weather.precipitation_mm if latest_weather else 0.0
    storm_alert = latest_weather.storm_alert if latest_weather else False

    # 3. Open incidents
    open_incidents = (
        db.query(Incident)
        .filter(
            Incident.asset_id == asset_id,
            Incident.status.in_(["Open", "Investigating"]),
        )
        .count()
    )

    # 4. Asset age in years
    age_years = max(0.5, (datetime.utcnow() - asset.installation_date).days / 365.25)

    # 5. Compute dimensional stresses
    thermal = calculate_thermal_stress(load_pct, oil_temp_c, ambient_temp_c)
    electrical = calculate_electrical_stress(voltage_kv, power_factor)
    mechanical = calculate_mechanical_stress(vibration_hz)
    environmental = calculate_environmental_stress(wind_speed, precip, storm_alert)

    # 6. Compute composite health score (0-100)
    health_score = calculate_health_score(
        thermal, electrical, mechanical, environmental, open_incidents, age_years
    )

    # 7. Compute failure probability (0.0 to 1.0)
    failure_prob = round(max(0.02, min(0.98, (100.0 - health_score) / 100.0)), 4)

    # Determine primary risk factor
    factors = {
        "Thermal Overload & High Oil Temperature": thermal,
        "Voltage Fluctuation & Reactive Power Stress": electrical,
        "Mechanical Core Vibration & Structural Wear": mechanical,
        "Adverse Weather & Storm Conditions": environmental,
    }
    if open_incidents > 0:
        factors["Active Unresolved Incidents"] = 0.85

    primary_factor = max(factors, key=factors.get)

    # 8. Assign Risk Level, Recommended Action, and Time to Failure
    # CRITICAL BUG FIX: Correct threshold mapping (Lower health = Higher risk)
    if health_score <= 35.0 or failure_prob >= 0.65:
        risk_level = "Critical"
        recommended_action = (
            "Immediate de-energization or emergency load shedding; dispatch primary rapid-response crew within 2 hours."
        )
        time_to_failure = round(max(2.0, (health_score / 35.0) * 16.0), 1)
        asset.status = "Critical"
    elif health_score <= 60.0 or failure_prob >= 0.40:
        risk_level = "High"
        recommended_action = (
            "Schedule urgent thermal scan and diagnostic oil analysis within 24 hours; curtail peak load by 25%."
        )
        time_to_failure = round(24.0 + ((health_score - 35.0) / 25.0) * 48.0, 1)
        asset.status = "Degraded"
    elif health_score <= 78.0 or failure_prob >= 0.22:
        risk_level = "Medium"
        recommended_action = (
            "Queue for preventative maintenance inspection during next regional maintenance outage."
        )
        time_to_failure = round(96.0 + ((health_score - 60.0) / 18.0) * 120.0, 1)
        asset.status = "Operational"
    else:
        risk_level = "Low"
        recommended_action = "Nominal operation. Continue standard 60-second automated telemetry polling."
        time_to_failure = None
        asset.status = "Operational"

    confidence = 0.94 if latest_reading is not None else 0.75

    prediction = RiskPrediction(
        asset_id=asset_id,
        timestamp=datetime.utcnow(),
        failure_probability=failure_prob,
        risk_level=risk_level,
        health_score=health_score,
        primary_risk_factor=primary_factor,
        recommended_action=recommended_action,
        time_to_failure_hours=time_to_failure,
        confidence_score=confidence,
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def run_all_predictions(db: Session) -> List[RiskPrediction]:
    """Evaluates and persists risk predictions for every registered asset in the grid."""
    assets = db.query(Asset).all()
    predictions = []
    for asset in assets:
        pred = compute_risk_for_asset(db, asset.asset_id)
        predictions.append(pred)
    return predictions
