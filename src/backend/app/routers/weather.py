from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import WeatherData
from ..schemas import WeatherDataOut

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather & Environmental Conditions"],
)


@router.get(
    "/current",
    response_model=List[WeatherDataOut],
    summary="Get current weather data by grid zone",
    description="Fetches the most recent meteorological observations (ambient temperature, wind speed, precipitation, solar irradiance, storm alerts) for all active grid sectors.",
)
def get_current_weather(db: Session = Depends(get_db)):
    zones = ["North", "South", "East", "West", "Central"]
    current_conditions: List[WeatherData] = []
    for zone in zones:
        latest = (
            db.query(WeatherData)
            .filter(WeatherData.zone == zone)
            .order_by(WeatherData.timestamp.desc())
            .first()
        )
        if latest:
            current_conditions.append(latest)
    return current_conditions
