import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum("customer", "support_agent", "admin", name="user_role"),
        nullable=False, default="customer"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="customer")
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="customer")
    refunds_requested: Mapped[list["Refund"]] = relationship("Refund", foreign_keys="Refund.requested_by", back_populates="requester")
    refunds_reviewed: Mapped[list["Refund"]] = relationship("Refund", foreign_keys="Refund.reviewed_by", back_populates="reviewer")
    escalations_assigned: Mapped[list["Escalation"]] = relationship("Escalation", back_populates="assignee")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="actor")
