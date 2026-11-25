from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.refund import Refund
from app.schemas.refund import RefundCreate, RefundReview, RefundResponse
from app.services.refund_service import RefundService
from app.services.audit_service import AuditService
from typing import List
from datetime import datetime, timezone

router = APIRouter(prefix="/refunds", tags=["Refunds"])

@router.post("/", response_model=RefundResponse, status_code=201)
def create_refund(payload: RefundCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = RefundService(db)
    try:
        refund = svc.create_refund(payload, current_user)
        AuditService(db).log("refund_requested", current_user.id, "refund", refund.id, {"amount": float(refund.amount)})
        return refund
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate refund request detected")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/{refund_id}", response_model=RefundResponse)
def get_refund(refund_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    if current_user.role == "customer" and refund.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return refund

@router.get("/", response_model=List[RefundResponse])
def list_refunds(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        return db.query(Refund).filter(Refund.requested_by == current_user.id).all()
    return db.query(Refund).all()

@router.patch("/{refund_id}/review", response_model=RefundResponse)
def review_refund(refund_id: str, payload: RefundReview, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("support_agent", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    if refund.status not in ("pending", "escalated"):
        raise HTTPException(status_code=400, detail="Refund already reviewed")
    refund.status = payload.decision
    refund.reviewed_by = current_user.id
    refund.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(refund)
    AuditService(db).log(f"refund_{payload.decision}", current_user.id, "refund", refund.id, {"note": payload.internal_note})
    return refund
