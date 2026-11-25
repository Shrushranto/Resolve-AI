import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.order import Order
from app.models.ticket import Ticket
from datetime import date, timedelta

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def customer(db):
    user = User(id="test-cust-001", name="Test Customer", email="customer@test.com",
                password_hash=get_password_hash("testpass123"), role="customer")
    db.add(user)
    db.commit()
    return user

@pytest.fixture
def customer2(db):
    user = User(id="test-cust-002", name="Other Customer", email="other@test.com",
                password_hash=get_password_hash("testpass123"), role="customer")
    db.add(user)
    db.commit()
    return user

@pytest.fixture
def agent(db):
    user = User(id="test-agent-001", name="Test Agent", email="agent@test.com",
                password_hash=get_password_hash("agentpass123"), role="support_agent")
    db.add(user)
    db.commit()
    return user

@pytest.fixture
def delivered_order(db, customer):
    order = Order(
        id="test-order-001", customer_id=customer.id,
        status="delivered",
        delivery_date=date.today() - timedelta(days=5),
        total_amount=2500.00, category="electronics",
        item_details={"name": "Test Product"},
    )
    db.add(order)
    db.commit()
    return order

@pytest.fixture
def expired_order(db, customer):
    order = Order(
        id="test-order-exp", customer_id=customer.id,
        status="delivered",
        delivery_date=date.today() - timedelta(days=60),
        total_amount=1500.00, category="clothing",
        item_details={"name": "Old Product"},
    )
    db.add(order)
    db.commit()
    return order

@pytest.fixture
def ticket(db, customer, delivered_order):
    t = Ticket(id="test-ticket-001", customer_id=customer.id, order_id=delivered_order.id,
               subject="Test Ticket", description="Test Description", category="refund")
    db.add(t)
    db.commit()
    return t

def get_token(client, email: str, password: str) -> str:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]
