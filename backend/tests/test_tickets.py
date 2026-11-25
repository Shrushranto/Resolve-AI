from tests.conftest import get_token

def test_create_ticket(client, customer):
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.post("/tickets/", json={
        "subject": "My TV is broken",
        "description": "Screen cracked on arrival",
        "category": "refund",
        "priority": "high"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["subject"] == "My TV is broken"
    assert data["customer_id"] == customer.id

def test_list_tickets_customer_scoped(client, customer, customer2, db, ticket):
    from app.models.ticket import Ticket
    other = Ticket(customer_id=customer2.id, subject="Other", description="x", category="general")
    db.add(other); db.commit()
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.get("/tickets/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()]
    assert ticket.id in ids
    assert other.id not in ids

def test_get_ticket_owner(client, customer, ticket):
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.get(f"/tickets/{ticket.id}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

def test_messages_saved_and_retrieved(client, customer, ticket):
    token = get_token(client, "customer@test.com", "testpass123")
    resp = client.post(f"/tickets/{ticket.id}/chat",
        json={"message": "Hello, I need help"},
        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["sender_type"] == "ai_agent"

    msgs = client.get(f"/tickets/{ticket.id}/messages", headers={"Authorization": f"Bearer {token}"})
    assert msgs.status_code == 200
    assert len(msgs.json()) >= 2
