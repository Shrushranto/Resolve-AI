# SupportAI — Architecture

## Overview

SupportAI is a full-stack e-commerce customer support platform with an AI agent that handles ticket conversations, processes refunds, and escalates complex cases to human staff.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18 + Vite)                │
│                                                                   │
│  ┌──────────────────────┐    ┌────────────────────────────────┐  │
│  │   Customer Portal     │    │      Support Dashboard          │  │
│  │  - Register / Login   │    │  - Ticket list + search/filter │  │
│  │  - Order history      │    │  - Ticket detail + status      │  │
│  │  - Create tickets     │    │  - Escalation review           │  │
│  │  - AI chat interface  │    │  - Refund approve / reject     │  │
│  │  - Refund tracking    │    │  - Internal notes              │  │
│  └──────────────────────┘    └────────────────────────────────┘  │
│                   │  REST + JWT (axios)  │                        │
└───────────────────┼─────────────────────┼────────────────────────┘
                    │                     │
                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python 3.11)               │
│                                                                   │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐  │
│  │ /auth    │ │/orders  │ │/tickets │ │/refunds  │ │/escal. │  │
│  │ register │ │ list    │ │  CRUD   │ │  create  │ │  list  │  │
│  │ login    │ │ detail  │ │  chat   │ │  review  │ │ decide │  │
│  │ me       │ │         │ │ status  │ │          │ │        │  │
│  └──────────┘ └─────────┘ └────┬────┘ └──────────┘ └────────┘  │
│                                 │                                 │
│                    ┌────────────▼────────────────┐               │
│                    │        AI Agent Service       │               │
│                    │  ┌──────────────────────┐   │               │
│                    │  │  Guardrails           │   │               │
│                    │  │  (prompt injection    │   │               │
│                    │  │   detection)          │   │               │
│                    │  └──────────────────────┘   │               │
│                    │  ┌──────────────────────┐   │               │
│                    │  │  Gemini Function     │   │               │
│                    │  │  Calling Loop        │   │               │
│                    │  │  (max 5 iterations)  │   │               │
│                    │  └──────────────────────┘   │               │
│                    │  ┌──────────────────────┐   │               │
│                    │  │  Tool Dispatcher     │   │               │
│                    │  │  get_order_details   │   │               │
│                    │  │  search_return_policy│   │               │
│                    │  │  process_refund      │   │               │
│                    │  │  escalate_to_human   │   │               │
│                    │  └──────────────────────┘   │               │
│                    └────────────┬────────────────┘               │
│                                 │                                 │
│  ┌──────────────────────────────▼──────────────────────────┐     │
│  │                 Business Rule Enforcement                 │     │
│  │  • Order ownership check (customer_id)                   │     │
│  │  • 30-day return window validation                       │     │
│  │  • ₹5,000 escalation threshold                          │     │
│  │  • Idempotency key (no duplicate refunds)                │     │
│  │  • Audit log for every refund/escalation event          │     │
│  └──────────────────────────────┬──────────────────────────┘     │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
              ┌───────────────────┴──────────────────┐
              │                                       │
              ▼                                       ▼
┌─────────────────────────┐             ┌────────────────────────┐
│   PostgreSQL Database    │             │   Local Policy RAG     │
│   (SQLAlchemy + Alembic) │             │   (data/policy.txt)   │
│   Users, Orders,        │             │   TF-IDF keyword       │
│   Tickets, Messages,    │             │   retrieval — no       │
│   Refunds, Escalations, │             │   external deps        │
│   AuditLogs             │             └────────────────────────┘
└─────────────────────────┘
```

---

## Key Design Decisions

### Security
- **Backend is the authority**: LLM cannot directly trigger refunds or bypass business rules. All tool implementations re-validate on the server.
- **JWT authentication**: Short-lived tokens (60 min), role embedded in claim.
- **RBAC**: Every endpoint checks role; customers only see their own data.
- **Prompt injection protection**: Regex-based guardrail layer before LLM call.
- **Idempotency keys**: Prevent duplicate refund records even on retried requests.
- **Audit trail**: Every refund request, approval, rejection, and escalation is logged.

### AI Agent
- Uses **Gemini function calling** for structured tool invocation.
- Falls back to a **rule-based mock** when no API key is present (safe for evaluation).
- Maintains **multi-turn context** via conversation history from the database.
- **System prompt is locked** — cannot be overridden by user input.

### RAG (Policy Retrieval)
- **Local keyword retrieval** over `data/policy.txt` — no vector DB, no external service.
- Sections parsed by `#` headers, scored by keyword overlap with the query.
- Inspectable: humans can read and edit the policy file directly.

### Human Review Flow
```
Customer requests refund
        │
        ▼
Backend validates eligibility
        │
  ┌─────┴──────┐
  │            │
≤ ₹5,000    > ₹5,000
  │            │
  ▼            ▼
Pending      Escalated ──► Escalation record created
  │            │
  ▼            ▼
Approved    Support agent reviews in dashboard
(auto if    → Approve (triggers refund approval)
 eligible)  → Reject
            → Request more info
```
