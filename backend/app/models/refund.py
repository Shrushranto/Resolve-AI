import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Numeric, Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Refund(Base):
    __tablename__ = "refunds"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_refund_idempotency"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False, index=True)
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "approved", "rejected", "escalated", name="refund_status"),
        nullable=False, default="pending"
    )
    requested_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    reviewed_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="refunds")
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="refunds")
    requester: Mapped["User"] = relationship("User", foreign_keys=[requested_by], back_populates="refunds_requested")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewed_by], back_populates="refunds_reviewed")
