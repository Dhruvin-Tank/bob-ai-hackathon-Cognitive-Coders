from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, RiskPrediction
from ..schemas import RiskPredictionOut
from ..services.risk_engine import run_all_predictions

router = APIRouter(
    prefix="/api/predictions",
    tags=["Predictive Risk Engine"],
)


@router.get(
    "",
    response_model=List[RiskPredictionOut],
    summary="Get active risk predictions across all grid assets",
    description="Returns the latest computed risk assessment, failure probability, and time-to-failure for each registered asset in the grid.",
)
def get_all_predictions(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    results: List[RiskPrediction] = []
    for asset in assets:
        pred = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.asset_id == asset.asset_id)
            .order_by(RiskPrediction.timestamp.desc())
            .first()
        )
        if pred:
            results.append(pred)
    return results


@router.post(
    "/run",
    response_model=List[RiskPredictionOut],
    status_code=status.HTTP_200_OK,
    summary="Execute real-time grid risk simulation & calculation",
    description="Forces immediate recalculation of thermal, electrical, mechanical, and environmental risk models for all grid assets, persisting new prediction records.",
)
def trigger_all_predictions(db: Session = Depends(get_db)):
    new_predictions = run_all_predictions(db)
    return new_predictions
