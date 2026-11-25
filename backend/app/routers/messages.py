from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.ticket import Ticket
from app.models.message import Message
from app.schemas.message import ChatRequest, MessageResponse
from typing import List

router = APIRouter(prefix="/tickets", tags=["Messages"])

@router.get("/{ticket_id}/messages", response_model=List[MessageResponse])
def get_messages(ticket_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at).all()

@router.post("/{ticket_id}/chat", response_model=MessageResponse)
def chat_with_agent(ticket_id: str, payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can chat with the AI agent")
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    customer_msg = Message(
        ticket_id=ticket_id,
        sender_type="customer",
        content=payload.message,
    )
    db.add(customer_msg)
    db.commit()

    history = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at).all()

    from app.services.ai_agent.agent import AgentService
    agent = AgentService(db=db, current_user=current_user, ticket=ticket)
    agent_response = agent.process_message(payload.message, history)

    agent_msg = Message(
        ticket_id=ticket_id,
        sender_type="ai_agent",
        content=agent_response,
    )
    db.add(agent_msg)
    db.commit()
    db.refresh(agent_msg)
    return agent_msg
