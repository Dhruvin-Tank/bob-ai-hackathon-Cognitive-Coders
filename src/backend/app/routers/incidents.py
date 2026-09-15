from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Incident
from ..schemas import IncidentOut

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents & Fault Logs"],
)


@router.get(
    "",
    response_model=List[IncidentOut],
    summary="List grid electrical and thermal incidents",
    description="Returns chronological logs of physical and electrical grid incidents (insulation breakdown, thermal runaway, partial discharge, storm disruptions).",
)
def list_incidents(
    asset_id: Optional[str] = Query(None, description="Filter incidents by asset identifier (e.g. TX-114)"),
    severity: Optional[str] = Query(None, description="Filter by severity level (Critical, High, Medium, Low)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by lifecycle status (Open, Investigating, Resolved)"),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)
    if asset_id:
        query = query.filter(Incident.asset_id == asset_id)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status_filter:
        query = query.filter(Incident.status == status_filter)

    incidents = query.order_by(Incident.timestamp.desc()).all()
    return incidents
