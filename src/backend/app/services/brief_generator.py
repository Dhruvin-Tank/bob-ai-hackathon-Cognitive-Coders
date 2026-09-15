from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models import Asset, MaintenancePlan, RiskPrediction
from ..schemas import (
    ActionItemOut,
    CrewDeploymentOut,
    OperatorBriefOut,
)


def _latest_prediction_for_asset(
    db: Session, asset_id: str
) -> Optional[RiskPrediction]:
    """Retrieves the most recent RiskPrediction record for a specific asset."""
    return (
        db.query(RiskPrediction)
        .filter(RiskPrediction.asset_id == asset_id)
        .order_by(RiskPrediction.timestamp.desc())
        .first()
    )


def _grid_zone(asset: Asset) -> str:
    """Helper to extract normalized grid zone for an asset."""
    return asset.zone if asset.zone else "Central"


def _level_from_score(health_score: float) -> str:
    """Derives standard categorical severity from quantitative health score."""
    if health_score <= 35.0:
        return "Critical"
    elif health_score <= 60.0:
        return "High"
    elif health_score <= 78.0:
        return "Medium"
    return "Low"


def generate_action_items(db: Session) -> List[ActionItemOut]:
    """Extracts prioritized tactical action items for all assets experiencing elevated risk."""
    assets = db.query(Asset).all()
    actions: List[ActionItemOut] = []

    for asset in assets:
        pred = _latest_prediction_for_asset(db, asset.asset_id)
        if not pred:
            continue

        if pred.risk_level == "Critical":
            actions.append(
                ActionItemOut(
                    asset_id=asset.asset_id,
                    priority="Immediate",
                    risk_level=pred.risk_level,
                    action=pred.recommended_action,
                    reason=f"Asset Health Index at {pred.health_score}%. Imminent risk factor: {pred.primary_risk_factor}.",
                    deadline_hours=pred.time_to_failure_hours or 2.0,
                )
            )
        elif pred.risk_level == "High":
            actions.append(
                ActionItemOut(
                    asset_id=asset.asset_id,
                    priority="Urgent",
                    risk_level=pred.risk_level,
                    action=pred.recommended_action,
                    reason=f"Asset Health Index degraded to {pred.health_score}%. Risk driver: {pred.primary_risk_factor}.",
                    deadline_hours=pred.time_to_failure_hours or 24.0,
                )
            )
        elif pred.risk_level == "Medium":
            actions.append(
                ActionItemOut(
                    asset_id=asset.asset_id,
                    priority="Medium",
                    risk_level=pred.risk_level,
                    action=pred.recommended_action,
                    reason=f"Moderate wear observed (AHI {pred.health_score}%). Risk driver: {pred.primary_risk_factor}.",
                    deadline_hours=pred.time_to_failure_hours or 120.0,
                )
            )

    # Sort so Immediate/Critical actions precede Urgent/Medium
    priority_order = {"Immediate": 0, "Urgent": 1, "Medium": 2, "Routine": 3}
    actions.sort(key=lambda x: priority_order.get(x.priority, 99))
    return actions


def generate_crew_plan(db: Session) -> List[CrewDeploymentOut]:
    """Generates real-time crew assignment roster synchronized with asset risk levels
    and active maintenance work orders."""
    plans = (
        db.query(MaintenancePlan)
        .filter(MaintenancePlan.status.in_(["Pending", "In Progress"]))
        .all()
    )
    deployments: List[CrewDeploymentOut] = []

    now = datetime.utcnow()
    for plan in plans:
        deployments.append(
            CrewDeploymentOut(
                crew_id=plan.crew_id,
                target_asset_id=plan.asset_id,
                priority=plan.priority,
                task_description=f"{plan.description} - Parts: {plan.parts_required or 'Standard kit'}",
                estimated_duration_hours=plan.estimated_duration_hours,
                scheduled_time=plan.scheduled_date,
            )
        )

    # If critical assets lack active maintenance plans, automatically synthesize rapid deployment
    critical_preds = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.risk_level == "Critical")
        .all()
    )
    assigned_assets = {p.asset_id for p in plans}

    crew_counter = 1
    for pred in critical_preds:
        if pred.asset_id not in assigned_assets:
            deployments.append(
                CrewDeploymentOut(
                    crew_id=f"RAPID-CREW-0{crew_counter}",
                    target_asset_id=pred.asset_id,
                    priority="Immediate",
                    task_description=f"EMERGENCY DISPATCH: Mitigate {pred.primary_risk_factor} on {pred.asset_id}",
                    estimated_duration_hours=4.0,
                    scheduled_time=now + timedelta(minutes=30),
                )
            )
            crew_counter += 1

    return deployments


def generate_brief(db: Session) -> OperatorBriefOut:
    """Compiles the high-level executive operator brief summarizing grid stability,
    risk breakdowns, action items, and field crew deployments."""
    assets = db.query(Asset).all()
    total_assets = len(assets)

    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0

    for asset in assets:
        pred = _latest_prediction_for_asset(db, asset.asset_id)
        if pred:
            level = pred.risk_level
        else:
            level = "Low"

        if level == "Critical":
            critical_count += 1
        elif level == "High":
            high_count += 1
        elif level == "Medium":
            medium_count += 1
        else:
            low_count += 1

    if critical_count > 0:
        grid_status = "CRITICAL_ALERT"
        summary = (
            f"CRITICAL WARNING: {critical_count} asset(s) at immediate failure threshold. "
            f"Emergency crew dispatches initiated. {high_count} asset(s) under high surveillance."
        )
    elif high_count > 0:
        grid_status = "ELEVATED_RISK"
        summary = (
            f"ELEVATED RISK: {high_count} asset(s) exhibiting thermal/electrical degradation. "
            f"No immediate outages detected. Maintenance schedule optimized."
        )
    else:
        grid_status = "NOMINAL"
        summary = (
            f"ALL SYSTEMS NOMINAL: {total_assets} transmission and distribution assets operating "
            f"within standard thermal, electrical, and mechanical tolerances."
        )

    action_items = generate_action_items(db)
    crew_deployments = generate_crew_plan(db)

    return OperatorBriefOut(
        generated_at=datetime.utcnow(),
        grid_status=grid_status,
        total_assets_monitored=total_assets,
        critical_risk_count=critical_count,
        high_risk_count=high_count,
        medium_risk_count=medium_count,
        low_risk_count=low_count,
        action_items=action_items,
        crew_deployments=crew_deployments,
        summary_text=summary,
    )
