from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.ticket import Ticket
from app.models.order import Order
from app.schemas.ticket import TicketCreate, TicketStatusUpdate, TicketResponse
from typing import List
from datetime import datetime, timezone

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(payload: TicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.order_id:
        order = db.query(Order).filter(Order.id == payload.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if current_user.role == "customer" and order.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your order")
    ticket = Ticket(
        customer_id=current_user.id,
        order_id=payload.order_id,
        subject=payload.subject,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/", response_model=List[TicketResponse])
def list_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        return db.query(Ticket).filter(Ticket.customer_id == current_user.id).all()
    return db.query(Ticket).all()

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return ticket

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(ticket_id: str, payload: TicketStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = payload.status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket
