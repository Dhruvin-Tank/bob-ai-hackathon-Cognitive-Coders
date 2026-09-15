from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, Incident, MaintenancePlan, RiskPrediction, SensorReading
from ..schemas import (
    AssetCreate,
    AssetDetailOut,
    AssetOut,
    AssetWithRiskOut,
    IncidentOut,
    MaintenancePlanOut,
    RiskPredictionOut,
    SensorReadingOut,
)
from ..services.risk_engine import compute_risk_for_asset

router = APIRouter(
    prefix="/api/assets",
    tags=["Assets & Grid Topology"],
)


@router.get(
    "",
    response_model=List[AssetWithRiskOut],
    summary="List all grid assets with real-time risk status",
    description="Retrieve all monitored grid assets (transformers, substations, feeders) augmented with their latest health score, failure probability, and risk tier.",
)
def list_assets(
    zone: Optional[str] = Query(None, description="Filter by grid zone (North, South, East, West, Central)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by operating status (Operational, Degraded, Critical, Offline)"),
    db: Session = Depends(get_db),
):
    query = db.query(Asset)
    if zone:
        query = query.filter(Asset.zone == zone)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    assets = query.all()

    results: List[AssetWithRiskOut] = []
    for asset in assets:
        pred = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.asset_id == asset.asset_id)
            .order_by(RiskPrediction.timestamp.desc())
            .first()
        )
        if pred:
            failure_prob = pred.failure_probability
            risk_level = pred.risk_level
            health_score = pred.health_score
            primary_factor = pred.primary_risk_factor
            action = pred.recommended_action
            updated = pred.timestamp
        else:
            failure_prob = 0.05
            risk_level = "Low"
            health_score = 95.0
            primary_factor = "Normal Operating Baseline"
            action = "Routine monitoring."
            updated = asset.created_at or datetime.utcnow()

        results.append(
            AssetWithRiskOut(
                asset_id=asset.asset_id,
                name=asset.name,
                asset_type=asset.asset_type,
                zone=asset.zone,
                status=asset.status,
                rated_capacity_mva=asset.rated_capacity_mva,
                failure_probability=failure_prob,
                risk_level=risk_level,
                health_score=health_score,
                primary_risk_factor=primary_factor,
                recommended_action=action,
                last_updated=updated,
            )
        )
    return results


@router.get(
    "/{asset_id}",
    response_model=AssetDetailOut,
    summary="Get comprehensive asset telemetry and history",
    description="Fetch granular operational profile for a single asset including latest telemetry sensor packet, active risk scoring, open incidents, and scheduled work orders.",
)
def get_asset_detail(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found in grid registry.",
        )

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.asset_id == asset_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    latest_pred = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.asset_id == asset_id)
        .order_by(RiskPrediction.timestamp.desc())
        .first()
    )

    incidents = (
        db.query(Incident)
        .filter(Incident.asset_id == asset_id)
        .order_by(Incident.timestamp.desc())
        .all()
    )

    plans = (
        db.query(MaintenancePlan)
        .filter(MaintenancePlan.asset_id == asset_id)
        .order_by(MaintenancePlan.scheduled_date.asc())
        .all()
    )

    return AssetDetailOut(
        asset=AssetOut.model_validate(asset),
        latest_sensor_reading=SensorReadingOut.model_validate(latest_reading) if latest_reading else None,
        latest_risk_prediction=RiskPredictionOut.model_validate(latest_pred) if latest_pred else None,
        recent_incidents=[IncidentOut.model_validate(inc) for inc in incidents],
        maintenance_plans=[MaintenancePlanOut.model_validate(mp) for mp in plans],
    )


@router.post(
    "",
    response_model=AssetOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register new electrical grid asset",
    description="Registers a new power transformer, substation, or feeder line into the live monitoring network.",
)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)):
    existing = db.query(Asset).filter(Asset.asset_id == payload.asset_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset with ID '{payload.asset_id}' is already registered.",
        )

    new_asset = Asset(
        asset_id=payload.asset_id,
        name=payload.name,
        asset_type=payload.asset_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        zone=payload.zone,
        installation_date=payload.installation_date,
        rated_capacity_mva=payload.rated_capacity_mva,
        status=payload.status,
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset


@router.get(
    "/{asset_id}/risk",
    response_model=RiskPredictionOut,
    summary="Get real-time risk prediction for single asset",
    description="Retrieves the active predictive risk assessment or recalculates on-demand using current telemetry vectors.",
)
def get_asset_risk(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found in grid topology.",
        )

    pred = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.asset_id == asset_id)
        .order_by(RiskPrediction.timestamp.desc())
        .first()
    )
    if not pred:
        pred = compute_risk_for_asset(db, asset_id)

    return pred
