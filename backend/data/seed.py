import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User, Order, Ticket, Message, Refund, Escalation, AuditLog
from app.core.security import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already seeded.")
            return

        customer1 = User(id="user-cust-001", name="Priya Sharma", email="priya@example.com", password_hash=get_password_hash("password123"), role="customer")
        customer2 = User(id="user-cust-002", name="Rahul Verma", email="rahul@example.com", password_hash=get_password_hash("password123"), role="customer")
        agent1 = User(id="user-agent-001", name="Aarav Singh", email="agent@supportai.com", password_hash=get_password_hash("agentpass123"), role="support_agent")
        admin1 = User(id="user-admin-001", name="Admin User", email="admin@supportai.com", password_hash=get_password_hash("adminpass123"), role="admin")
        db.add_all([customer1, customer2, agent1, admin1])
        db.commit()

        today = date.today()
        order1 = Order(id="order-001", customer_id="user-cust-001", status="delivered", delivery_date=today - timedelta(days=5), total_amount=2500.00, category="electronics", item_details={"name": "Wireless Earbuds", "qty": 1})
        order2 = Order(id="order-002", customer_id="user-cust-001", status="delivered", delivery_date=today - timedelta(days=45), total_amount=1200.00, category="clothing", item_details={"name": "Cotton Kurta Set", "qty": 2})
        order3 = Order(id="order-003", customer_id="user-cust-001", status="delivered", delivery_date=today - timedelta(days=10), total_amount=8500.00, category="electronics", item_details={"name": "Smart Watch", "qty": 1})
        order4 = Order(id="order-004", customer_id="user-cust-001", status="processing", delivery_date=None, total_amount=3200.00, category="furniture", item_details={"name": "Office Chair", "qty": 1})
        order5 = Order(id="order-005", customer_id="user-cust-002", status="delivered", delivery_date=today - timedelta(days=3), total_amount=4800.00, category="electronics", item_details={"name": "Bluetooth Speaker", "qty": 1})
        db.add_all([order1, order2, order3, order4, order5])
        db.commit()

        ticket1 = Ticket(id="ticket-001", customer_id="user-cust-001", order_id="order-001", subject="Earbuds not working properly", description="The left earbud stops playing after 10 minutes.", category="refund", status="open", priority="medium")
        ticket2 = Ticket(id="ticket-002", customer_id="user-cust-001", order_id="order-003", subject="Smart Watch refund request", description="I want to return my smart watch as it doesn't meet my expectations.", category="refund", status="in_progress", priority="high")
        ticket3 = Ticket(id="ticket-003", customer_id="user-cust-002", order_id="order-005", subject="Speaker delivery issue", description="Speaker arrived but volume button is broken.", category="delivery", status="open", priority="medium")
        db.add_all([ticket1, ticket2, ticket3])
        db.commit()

        db.add(Message(ticket_id="ticket-001", sender_type="customer", content="Hi, I bought earbuds and the left one stopped working. I want a refund."))
        db.add(Message(ticket_id="ticket-001", sender_type="ai_agent", content="Hello Priya! I'm sorry to hear about your earbuds. I'll need your order ID to look into this. Could you please confirm it's order-001?"))
        db.add(Message(ticket_id="ticket-002", sender_type="customer", content="I want to return my smart watch. Order ID is order-003."))
        db.add(Message(ticket_id="ticket-002", sender_type="ai_agent", content="I've checked your order. The total is ₹8,500. Since this exceeds ₹5,000, I'll need to escalate this to our support team for review."))
        db.commit()

        esc = Escalation(
            id="esc-001",
            ticket_id="ticket-002",
            summary="Customer requesting refund of ₹8,500 for Smart Watch (order-003). Delivered 10 days ago, within return window. Amount exceeds ₹5,000 threshold — requires human approval.",
            priority="high",
            decision="pending",
        )
        db.add(esc)

        db.add(Refund(
            id="refund-001",
            order_id="order-003",
            ticket_id="ticket-002",
            amount=8500.00,
            reason="Customer dissatisfied with Smart Watch features",
            status="escalated",
            requested_by="user-cust-001",
            idempotency_key="order-003:user-cust-001:ticket-002",
        ))
        db.commit()

        print("Seed data loaded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
