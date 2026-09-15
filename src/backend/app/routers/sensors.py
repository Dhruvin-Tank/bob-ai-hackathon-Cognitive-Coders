from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, SensorReading
from ..schemas import SensorReadingOut

router = APIRouter(
    prefix="/api/sensors",
    tags=["Telemetry & Sensor Ingestion"],
)


@router.get(
    "/{asset_id}/history",
    response_model=List[SensorReadingOut],
    summary="Retrieve sensor telemetry timeseries for an asset",
    description="Fetches chronological timeseries telemetry (voltage, current, oil temp, vibration, power factor, load %) for SCADA analytics and plotting.",
)
def get_sensor_history(
    asset_id: str,
    limit: int = Query(100, ge=1, le=1000, description="Max telemetry records to retrieve (chronological descending)"),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found.",
        )

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.asset_id == asset_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings
