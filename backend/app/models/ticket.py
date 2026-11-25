import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    order_id: Mapped[str | None] = mapped_column(String, ForeignKey("orders.id"), nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        SAEnum("refund", "delivery", "general", "technical", "billing", name="ticket_category"),
        nullable=False, default="general"
    )
    status: Mapped[str] = mapped_column(
        SAEnum("open", "in_progress", "resolved", "closed", name="ticket_status"),
        nullable=False, default="open"
    )
    priority: Mapped[str] = mapped_column(
        SAEnum("low", "medium", "high", "urgent", name="ticket_priority"),
        nullable=False, default="medium"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer: Mapped["User"] = relationship("User", back_populates="tickets")
    order: Mapped["Order"] = relationship("Order", back_populates="tickets")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")
    refunds: Mapped[list["Refund"]] = relationship("Refund", back_populates="ticket")
    escalations: Mapped[list["Escalation"]] = relationship("Escalation", back_populates="ticket")
