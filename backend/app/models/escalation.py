import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(
        SAEnum("low", "medium", "high", "urgent", name="escalation_priority"),
        nullable=False, default="medium"
    )
    assigned_to: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    decision: Mapped[str] = mapped_column(
        SAEnum("pending", "approved", "rejected", "more_info", name="escalation_decision"),
        nullable=False, default="pending"
    )
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="escalations")
    assignee: Mapped["User"] = relationship("User", back_populates="escalations_assigned")
