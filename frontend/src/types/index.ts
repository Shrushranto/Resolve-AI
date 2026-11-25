export interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'support_agent' | 'admin'
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_date: string | null
  total_amount: number
  category: string
  item_details: Record<string, unknown>
  created_at: string
}

export interface Ticket {
  id: string
  customer_id: string
  order_id: string | null
  subject: string
  description: string
  category: 'refund' | 'delivery' | 'general' | 'technical' | 'billing'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'ai_agent' | 'support_agent'
  content: string
  created_at: string
}

export interface Refund {
  id: string
  order_id: string
  ticket_id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'escalated'
  requested_by: string
  reviewed_by: string | null
  idempotency_key: string
  created_at: string
  reviewed_at: string | null
}

export interface Escalation {
  id: string
  ticket_id: string
  summary: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  decision: 'pending' | 'approved' | 'rejected' | 'more_info'
  internal_note: string | null
  created_at: string
  resolved_at: string | null
}

export interface ApiError {
  detail: string
}
