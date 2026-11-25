from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.ticket import Ticket
from app.models.refund import Refund
from app.models.escalation import Escalation
from app.models.user import User
from app.schemas.refund import RefundCreate
from app.core.config import settings
from app.services.ai_agent.rag import PolicyRAG

class RefundService:
    def __init__(self, db: Session):
        self.db = db
        self.rag = PolicyRAG()

    def validate_refund_eligibility(self, order: Order, amount: float, customer_id: str) -> None:
        if order.customer_id != customer_id:
            raise ValueError("You do not own this order")

        if order.status != "delivered":
            raise ValueError(f"Order is not eligible for refund (status: {order.status})")

        if not order.delivery_date:
            raise ValueError("Order has no delivery date on record")
        delivered = datetime.combine(order.delivery_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        days_since = (datetime.now(timezone.utc) - delivered).days
        if days_since > settings.RETURN_WINDOW_DAYS:
            raise ValueError(f"Return window expired. Items must be returned within {settings.RETURN_WINDOW_DAYS} days of delivery.")

        if amount > float(order.total_amount):
            raise ValueError(f"Refund amount exceeds order total of ₹{order.total_amount:.2f}")

        existing = self.db.query(Refund).filter(
            Refund.order_id == order.id,
            Refund.status.in_(["pending", "approved", "escalated"])
        ).first()
        if existing:
            raise ValueError("A refund request already exists for this order")

    def create_refund(self, payload: RefundCreate, current_user: User) -> Refund:
        ticket = self.db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
        if not ticket:
            raise ValueError("Ticket not found")
        if current_user.role == "customer" and ticket.customer_id != current_user.id:
            raise ValueError("Not your ticket")

        order = self.db.query(Order).filter(Order.id == payload.order_id).first()
        if not order:
            raise ValueError("Order not found")

        self.validate_refund_eligibility(order, payload.amount, current_user.id)

        if payload.amount > settings.ESCALATION_THRESHOLD:
            status = "escalated"
        else:
            status = "pending"

        refund = Refund(
            order_id=payload.order_id,
            ticket_id=payload.ticket_id,
            amount=payload.amount,
            reason=payload.reason,
            status=status,
            requested_by=current_user.id,
            idempotency_key=payload.idempotency_key,
        )
        self.db.add(refund)
        self.db.flush()

        if status == "escalated":
            escalation = Escalation(
                ticket_id=payload.ticket_id,
                summary=f"Refund of ₹{payload.amount:.2f} requested for order {payload.order_id}. Reason: {payload.reason}",
                priority="high",
            )
            self.db.add(escalation)

        self.db.commit()
        self.db.refresh(refund)
        return refund
