from tests.conftest import get_token

def test_register_customer(client):
    resp = client.post("/auth/register", json={
        "name": "New User", "email": "new@test.com", "password": "password123", "role": "customer"
    })
    assert resp.status_code == 201
    assert resp.json()["role"] == "customer"

def test_register_duplicate_email(client, customer):
    resp = client.post("/auth/register", json={
        "name": "Dup", "email": "customer@test.com", "password": "password123"
    })
    assert resp.status_code == 400

def test_login_success(client, customer):
    resp = client.post("/auth/login", json={"email": "customer@test.com", "password": "testpass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password(client, customer):
    resp = client.post("/auth/login", json={"email": "customer@test.com", "password": "wrongpass"})
    assert resp.status_code == 401

def test_unauthenticated_blocked(client):
    resp = client.get("/tickets/")
    assert resp.status_code == 401

def test_customer_cannot_access_other_ticket(client, customer, customer2, db):
    from app.models.ticket import Ticket
    t = Ticket(id="other-ticket", customer_id=customer2.id, subject="Other", description="Other", category="general")
    db.add(t); db.commit()
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.get("/tickets/other-ticket", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

def test_customer_cannot_access_other_order(client, customer, customer2, db):
    from app.models.order import Order
    from datetime import date
    o = Order(id="other-order", customer_id=customer2.id, status="delivered",
              delivery_date=date.today(), total_amount=100, category="general", item_details={})
    db.add(o); db.commit()
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.get("/orders/other-order", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404
