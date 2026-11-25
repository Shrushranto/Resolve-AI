from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.escalation import Escalation
from app.schemas.escalation import EscalationDecision, EscalationResponse
from app.services.audit_service import AuditService
from typing import List
from datetime import datetime, timezone

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("/", response_model=List[EscalationResponse])
def list_escalations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Escalation).all()

@router.get("/{escalation_id}", response_model=EscalationResponse)
def get_escalation(escalation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        raise HTTPException(status_code=403, detail="Access denied")
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return esc

@router.patch("/{escalation_id}/decision", response_model=EscalationResponse)
def decide_escalation(escalation_id: str, payload: EscalationDecision, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("support_agent", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    if payload.decision not in ("approved", "rejected", "more_info"):
        raise HTTPException(status_code=422, detail="Invalid decision")
    esc.decision = payload.decision
    esc.internal_note = payload.internal_note
    esc.assigned_to = current_user.id
    esc.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(esc)
    AuditService(db).log(f"escalation_{payload.decision}", current_user.id, "escalation", esc.id, {"note": payload.internal_note})
    if payload.decision == "approved":
        from app.models.refund import Refund
        refund = db.query(Refund).filter(Refund.ticket_id == esc.ticket_id, Refund.status == "escalated").first()
        if refund:
            refund.status = "approved"
            refund.reviewed_by = current_user.id
            refund.reviewed_at = datetime.now(timezone.utc)
            db.commit()
    return esc
