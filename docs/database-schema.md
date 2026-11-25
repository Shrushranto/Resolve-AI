# SupportAI — Database Schema

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USERS                                       │
│  id (PK, UUID)  name  email (UNIQUE)  password_hash  role  created_at│
└───────────┬──────────────────┬────────────────┬──────────────────────┘
            │                  │                │
            │ customer_id      │ requested_by   │ actor_id
            ▼                  ▼                ▼
┌──────────────────┐  ┌───────────────────┐  ┌──────────────┐
│     ORDERS       │  │     REFUNDS       │  │  AUDIT_LOGS  │
│  id (PK)         │  │  id (PK)          │  │  id (PK)     │
│  customer_id(FK) │  │  order_id (FK)    │  │  event_type  │
│  status          │  │  ticket_id (FK)   │  │  actor_id(FK)│
│  delivery_date   │  │  amount           │  │  resource_   │
│  total_amount    │  │  reason           │  │   type       │
│  category        │  │  status           │  │  resource_id │
│  item_details    │  │  requested_by(FK) │  │  details     │
│  created_at      │  │  reviewed_by(FK)  │  │  created_at  │
└───────┬──────────┘  │  idempotency_key  │  └──────────────┘
        │             │  (UNIQUE)         │
        │ order_id    │  created_at       │
        ▼             │  reviewed_at      │
┌───────────────────────────────────────────────────────┐
│                       TICKETS                          │
│  id (PK, UUID)                                        │
│  customer_id (FK → users.id)                          │
│  order_id (FK → orders.id, nullable)                  │
│  subject   description   category   status   priority │
│  created_at   updated_at                              │
└────────┬──────────────────────┬────────────────────────┘
         │                      │
         │ ticket_id            │ ticket_id
         ▼                      ▼
┌────────────────┐    ┌─────────────────────────────────┐
│    MESSAGES    │    │          ESCALATIONS            │
│  id (PK)       │    │  id (PK)                        │
│  ticket_id(FK) │    │  ticket_id (FK → tickets.id)    │
│  sender_type   │    │  summary                        │
│  content       │    │  priority                       │
│  created_at    │    │  assigned_to (FK → users.id)    │
└────────────────┘    │  decision                       │
                      │  internal_note                  │
                      │  created_at   resolved_at       │
                      └─────────────────────────────────┘
```

---

## Tables

### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| name | VARCHAR(255) | NOT NULL | Display name |
| email | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | Login email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| role | ENUM | NOT NULL | `customer`, `support_agent`, `admin` |
| created_at | TIMESTAMPTZ | NOT NULL | Auto-set |

### `orders`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| customer_id | VARCHAR | FK→users.id, INDEX | Owner |
| status | ENUM | NOT NULL | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| delivery_date | DATE | nullable | Date delivered |
| total_amount | NUMERIC(10,2) | NOT NULL | Amount in ₹ |
| category | VARCHAR(100) | NOT NULL | Product category |
| item_details | JSON | NOT NULL | Product name, qty, etc. |
| created_at | TIMESTAMPTZ | NOT NULL | Auto-set |

### `tickets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| customer_id | VARCHAR | FK→users.id, INDEX | Owner |
| order_id | VARCHAR | FK→orders.id, nullable | Related order |
| subject | VARCHAR(500) | NOT NULL | Short description |
| description | TEXT | NOT NULL | Full description |
| category | ENUM | NOT NULL | `refund`, `delivery`, `general`, `technical`, `billing` |
| status | ENUM | NOT NULL | `open`, `in_progress`, `resolved`, `closed` |
| priority | ENUM | NOT NULL | `low`, `medium`, `high`, `urgent` |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | On status change |

### `messages`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| ticket_id | VARCHAR | FK→tickets.id, INDEX | Parent ticket |
| sender_type | ENUM | NOT NULL | `customer`, `ai_agent`, `support_agent` |
| content | TEXT | NOT NULL | Message body |
| created_at | TIMESTAMPTZ | NOT NULL | |

### `refunds`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| order_id | VARCHAR | FK→orders.id, INDEX | Target order |
| ticket_id | VARCHAR | FK→tickets.id, INDEX | Source ticket |
| amount | NUMERIC(10,2) | NOT NULL | Amount in ₹ |
| reason | TEXT | NOT NULL | Customer-provided reason |
| status | ENUM | NOT NULL | `pending`, `approved`, `rejected`, `escalated` |
| requested_by | VARCHAR | FK→users.id | Customer |
| reviewed_by | VARCHAR | FK→users.id, nullable | Staff reviewer |
| idempotency_key | VARCHAR(255) | NOT NULL, UNIQUE | Prevents duplicate submissions |
| created_at | TIMESTAMPTZ | NOT NULL | |
| reviewed_at | TIMESTAMPTZ | nullable | When decision was made |

> **Idempotency key format**: `{order_id}:{customer_id}:{ticket_id}`

### `escalations`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| ticket_id | VARCHAR | FK→tickets.id, INDEX | Source ticket |
| summary | TEXT | NOT NULL | AI-generated context summary |
| priority | ENUM | NOT NULL | `low`, `medium`, `high`, `urgent` |
| assigned_to | VARCHAR | FK→users.id, nullable | Assigned staff |
| decision | ENUM | NOT NULL | `pending`, `approved`, `rejected`, `more_info` |
| internal_note | TEXT | nullable | Staff note |
| created_at | TIMESTAMPTZ | NOT NULL | |
| resolved_at | TIMESTAMPTZ | nullable | When decision recorded |

### `audit_logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR | PK | UUID |
| event_type | VARCHAR(100) | NOT NULL, INDEX | e.g. `refund_requested`, `escalation_approved` |
| actor_id | VARCHAR | FK→users.id, INDEX | Who performed the action |
| resource_type | VARCHAR(50) | NOT NULL | `refund`, `escalation`, `ticket` |
| resource_id | VARCHAR | NOT NULL, INDEX | ID of the affected resource |
| details | JSON | NOT NULL | Additional context |
| created_at | TIMESTAMPTZ | NOT NULL, INDEX | |

---

## Enums

| Enum Name | Values |
|-----------|--------|
| `user_role` | `customer`, `support_agent`, `admin` |
| `order_status` | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| `ticket_category` | `refund`, `delivery`, `general`, `technical`, `billing` |
| `ticket_status` | `open`, `in_progress`, `resolved`, `closed` |
| `ticket_priority` | `low`, `medium`, `high`, `urgent` |
| `sender_type` | `customer`, `ai_agent`, `support_agent` |
| `refund_status` | `pending`, `approved`, `rejected`, `escalated` |
| `escalation_priority` | `low`, `medium`, `high`, `urgent` |
| `escalation_decision` | `pending`, `approved`, `rejected`, `more_info` |

---

## Indexes

| Table | Column(s) | Type |
|-------|-----------|------|
| users | email | UNIQUE |
| orders | customer_id | INDEX |
| tickets | customer_id | INDEX |
| tickets | order_id | INDEX |
| messages | ticket_id | INDEX |
| refunds | order_id | INDEX |
| refunds | ticket_id | INDEX |
| refunds | idempotency_key | UNIQUE |
| escalations | ticket_id | INDEX |
| audit_logs | event_type | INDEX |
| audit_logs | actor_id | INDEX |
| audit_logs | resource_id | INDEX |
| audit_logs | created_at | INDEX |
