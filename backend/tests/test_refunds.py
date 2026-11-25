from tests.conftest import get_token

def test_eligible_refund_created(client, customer, delivered_order, ticket):
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.post("/refunds/", json={
        "order_id": delivered_order.id,
        "ticket_id": ticket.id,
        "amount": 2000.0,
        "reason": "Product defective",
        "idempotency_key": "test-idem-001"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"
    assert resp.json()["amount"] == 2000.0

def test_expired_return_window_rejected(client, customer, expired_order, db):
    from app.models.ticket import Ticket
    t = Ticket(customer_id=customer.id, order_id=expired_order.id, subject="Old", description="x", category="refund")
    db.add(t); db.commit()
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.post("/refunds/", json={
        "order_id": expired_order.id,
        "ticket_id": t.id,
        "amount": 500.0,
        "reason": "Expired return",
        "idempotency_key": "test-idem-exp"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422
    assert "Return window expired" in resp.json()["detail"]

def test_refund_above_threshold_escalated(client, customer, db):
    from app.models.order import Order
    from app.models.ticket import Ticket
    from datetime import date, timedelta
    order = Order(id="big-order", customer_id=customer.id, status="delivered",
                  delivery_date=date.today() - timedelta(days=3),
                  total_amount=9000.0, category="electronics", item_details={})
    db.add(order)
    t = Ticket(customer_id=customer.id, order_id="big-order", subject="Big refund", description="x", category="refund")
    db.add(t); db.commit()
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.post("/refunds/", json={
        "order_id": "big-order",
        "ticket_id": t.id,
        "amount": 8000.0,
        "reason": "Expensive item return",
        "idempotency_key": "test-idem-big"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "escalated"

def test_duplicate_refund_rejected(client, customer, delivered_order, ticket):
    token = get_token(client, "customer@test.com", "testpass123")
    payload = {
        "order_id": delivered_order.id,
        "ticket_id": ticket.id,
        "amount": 1000.0,
        "reason": "Defective",
        "idempotency_key": "dup-key-001"
    }
    r1 = client.post("/refunds/", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201
    r2 = client.post("/refunds/", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code in (409, 422)

def test_customer_cannot_refund_other_order(client, customer2, db):
    from app.models.order import Order
    from app.models.ticket import Ticket
    from datetime import date, timedelta
    order = Order(id="cust2-order", customer_id=customer2.id, status="delivered",
                  delivery_date=date.today() - timedelta(days=2),
                  total_amount=500.0, category="general", item_details={})
    db.add(order)
    t = Ticket(customer_id=customer2.id, order_id="cust2-order", subject="x", description="x", category="refund")
    db.add(t)
    db.commit()
    reg = client.post("/auth/register", json={"name":"Hacker","email":"hacker@test.com","password":"hackpass1","role":"customer"})
    assert reg.status_code == 201
    token = client.post("/auth/login", json={"email":"hacker@test.com","password":"hackpass1"}).json()["access_token"]
    resp = client.post("/refunds/", json={
        "order_id": "cust2-order",
        "ticket_id": t.id,
        "amount": 100.0,
        "reason": "Stealing",
        "idempotency_key": "hack-key"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code in (422, 403, 404)
