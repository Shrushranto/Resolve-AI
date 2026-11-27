# ResolveAI — AI-Powered E-Commerce Customer Support Platform

ResolveAI is a full-stack web application that enables e-commerce customers to raise support tickets, view orders, chat with an AI support agent, and request/track refunds, while providing support staff an internal dashboard to review tickets, handle escalations, and approve or reject refunds.

---

## Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 18 (Vite), TypeScript, React Router, Tailwind CSS | Responsive SPA with type safety |
| **Backend** | Python 3.11, FastAPI, Pydantic v2 | High-performance async REST API with automatic OpenAPI/Swagger docs |
| **Database** | PostgreSQL 16 + SQLAlchemy 2.0 + Alembic | Relational integrity, foreign keys, indexes, repeatable migrations |
| **AI / Agent** | Google Gemini (`gemini-1.5-flash`) with function calling + local mock fallback | Structured tool-use; works locally without paid API keys |
| **RAG** | Local keyword retrieval (`data/policy.txt`) | Transparent, inspectable policy source with zero external dependencies |
| **Testing** | pytest + httpx (`TestClient`) | Fast, isolated integration and security tests |
| **Deployment** | Docker + Docker Compose | One-command local environment |

---

## Prerequisites

- **Docker & Docker Compose** (recommended), OR:
  - Python 3.11+
  - Node.js 20+
  - PostgreSQL 16+ (or SQLite for quick testing)

---

## Quick Start (Docker Compose)

1. **Clone & configure environment**:
   ```bash
   cp .env.example .env
   # Optionally set GEMINI_API_KEY in .env (leave blank to use the built-in mock agent)
   ```

2. **Start all services** (PostgreSQL, FastAPI backend, Alembic migrations, seed data, React + Vite frontend):
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **Swagger / OpenAPI Docs**: http://localhost:8000/docs

---

## Local Development Setup (Without Docker)

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Configure .env at repo root or backend/.env
# Run migrations (if using PostgreSQL)
alembic upgrade head

# Seed demo data
python data/seed.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Accounts (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Customer | `priya@example.com` | `password123` |
| Customer | `rahul@example.com` | `password123` |
| Support Agent | `agent@supportai.com` | `agentpass123` |
| Admin | `admin@supportai.com` | `adminpass123` |

---

## Running Automated Tests

The backend test suite uses an isolated SQLite test database and covers all 9 required scenarios (authentication/RBAC, ticket & message persistence, missing order ID, eligible refund, expired return window, > ₹5,000 escalation, duplicate idempotency, prompt injection guardrails, and API error handling):

```bash
cd backend
pytest tests/ -v
```

---

## Documentation

- [Project Walkthrough Video](https://drive.google.com/file/d/1wRfXPhOjcQJ0657CH4S9uxrfy7w4Cppg/view?usp=drive_link)
- [Architecture & AI Agent Flow](docs/architecture.md)
- [Database Schema & ER Diagram](docs/database-schema.md)
- [Demo Walkthrough Guide](docs/demo-guide.md)
