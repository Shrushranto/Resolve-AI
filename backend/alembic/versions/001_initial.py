"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('customer','support_agent','admin', name='user_role'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table('orders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('customer_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.Enum('pending','processing','shipped','delivered','cancelled', name='order_status'), nullable=False),
        sa.Column('delivery_date', sa.Date(), nullable=True),
        sa.Column('total_amount', sa.Numeric(10,2), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('item_details', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_orders_customer_id', 'orders', ['customer_id'])

    op.create_table('tickets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('customer_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('order_id', sa.String(), sa.ForeignKey('orders.id'), nullable=True),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.Enum('refund','delivery','general','technical','billing', name='ticket_category'), nullable=False),
        sa.Column('status', sa.Enum('open','in_progress','resolved','closed', name='ticket_status'), nullable=False),
        sa.Column('priority', sa.Enum('low','medium','high','urgent', name='ticket_priority'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tickets_customer_id', 'tickets', ['customer_id'])

    op.create_table('messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('sender_type', sa.Enum('customer','ai_agent','support_agent', name='sender_type'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_messages_ticket_id', 'messages', ['ticket_id'])

    op.create_table('refunds',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('order_id', sa.String(), sa.ForeignKey('orders.id'), nullable=False),
        sa.Column('ticket_id', sa.String(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('amount', sa.Numeric(10,2), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('pending','approved','rejected','escalated', name='refund_status'), nullable=False),
        sa.Column('requested_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reviewed_by', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('idempotency_key', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key', name='uq_refund_idempotency'),
    )

    op.create_table('escalations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('ticket_id', sa.String(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('priority', sa.Enum('low','medium','high','urgent', name='escalation_priority'), nullable=False),
        sa.Column('assigned_to', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('decision', sa.Enum('pending','approved','rejected','more_info', name='escalation_decision'), nullable=False),
        sa.Column('internal_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('actor_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

def downgrade():
    op.drop_table('audit_logs')
    op.drop_table('escalations')
    op.drop_table('refunds')
    op.drop_table('messages')
    op.drop_table('tickets')
    op.drop_table('orders')
    op.drop_table('users')
    for t in ('user_role','order_status','ticket_category','ticket_status','ticket_priority','sender_type','refund_status','escalation_priority','escalation_decision'):
        op.execute(f"DROP TYPE IF EXISTS {t}")
