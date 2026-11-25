from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.refund import Refund
from app.models.escalation import Escalation
from app.models.ticket import Ticket
from app.models.user import User
from app.services.refund_service import RefundService
from app.services.ai_agent.rag import PolicyRAG
from app.core.config import settings

class AgentTools:
    def __init__(self, db: Session, current_user: User, ticket: Ticket):
        self.db = db
        self.current_user = current_user
        self.ticket = ticket
        self.rag = PolicyRAG()

    def get_order_details(self, order_id: str) -> dict:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"error": "Order not found"}
        if order.customer_id != self.current_user.id:
            return {"error": "Order not found"}
        return {
            "order_id": order.id,
            "status": order.status,
            "delivery_date": str(order.delivery_date) if order.delivery_date else None,
            "total_amount": float(order.total_amount),
            "category": order.category,
            "item_details": order.item_details,
        }

    def search_return_policy(self, category: str) -> dict:
        policy_text = self.rag.search(category)
        return {"policy": policy_text, "category": category}

    def process_refund(self, order_id: str, amount: float, reason: str) -> dict:
        refund_svc = RefundService(self.db)
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"error": "Order not found"}

        try:
            refund_svc.validate_refund_eligibility(order, amount, self.current_user.id)
        except ValueError as e:
            return {"error": str(e), "refund_created": False}

        idempotency_key = f"{order_id}:{self.current_user.id}:{self.ticket.id}"

        if amount > settings.ESCALATION_THRESHOLD:
            result = self.escalate_to_human(
                ticket_id=self.ticket.id,
                summary=f"Refund of ₹{amount:.2f} requested for order {order_id}. Reason: {reason}. Amount exceeds ₹{settings.ESCALATION_THRESHOLD:.0f} threshold — requires human review.",
                priority="high",
            )
            existing = self.db.query(Refund).filter(Refund.idempotency_key == idempotency_key).first()
            if not existing:
                refund = Refund(
                    order_id=order_id,
                    ticket_id=self.ticket.id,
                    amount=amount,
                    reason=reason,
                    status="escalated",
                    requested_by=self.current_user.id,
                    idempotency_key=idempotency_key,
                )
                self.db.add(refund)
                self.db.commit()
            return {
                "refund_created": False,
                "escalated": True,
                "message": f"Your refund of ₹{amount:.2f} exceeds ₹{settings.ESCALATION_THRESHOLD:.0f} and has been escalated for human review. You will be notified once a decision is made.",
                "escalation_id": result.get("escalation_id"),
            }

        existing = self.db.query(Refund).filter(Refund.idempotency_key == idempotency_key).first()
        if existing:
            return {
                "refund_created": False,
                "duplicate": True,
                "refund_id": existing.id,
                "status": existing.status,
                "message": "A refund request for this order already exists.",
            }

        refund = Refund(
            order_id=order_id,
            ticket_id=self.ticket.id,
            amount=amount,
            reason=reason,
            status="pending",
            requested_by=self.current_user.id,
            idempotency_key=idempotency_key,
        )
        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)
        return {
            "refund_created": True,
            "refund_id": refund.id,
            "amount": amount,
            "status": "pending",
            "message": f"Refund of ₹{amount:.2f} has been submitted and is pending review.",
        }

    def escalate_to_human(self, ticket_id: str, summary: str, priority: str = "medium") -> dict:
        if priority not in ("low", "medium", "high", "urgent"):
            priority = "medium"
        escalation = Escalation(
            ticket_id=ticket_id,
            summary=summary,
            priority=priority,
        )
        self.db.add(escalation)
        ticket = self.db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if ticket:
            ticket.status = "in_progress"
            ticket.priority = priority
        self.db.commit()
        self.db.refresh(escalation)
        return {
            "escalation_created": True,
            "escalation_id": escalation.id,
            "message": "Your case has been escalated to our support team. A human agent will review and respond shortly.",
        }
