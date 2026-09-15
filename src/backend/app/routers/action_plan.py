from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ActionItemOut, OperatorBriefOut
from ..services.brief_generator import generate_action_items, generate_brief

router = APIRouter(
    prefix="/api/action-plan",
    tags=["Action Plans & Dispatch"],
)


@router.get(
    "/actions",
    response_model=List[ActionItemOut],
    summary="Get prioritized operational action items",
    description="Generates an immediate triage action plan for grid dispatchers, prioritized by criticality (Immediate > Urgent > Medium).",
)
def get_action_items(db: Session = Depends(get_db)):
    return generate_action_items(db)


@router.get(
    "/brief",
    response_model=OperatorBriefOut,
    summary="Generate comprehensive operator briefing",
    description="Synthesizes full grid health status, critical asset counts, tactical action items, and field crew deployment rosters into an operational intelligence brief.",
)
def get_operator_brief(db: Session = Depends(get_db)):
    return generate_brief(db)
