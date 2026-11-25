import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    sender_type: Mapped[str] = mapped_column(
        SAEnum("customer", "ai_agent", "support_agent", name="sender_type"),
        nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="messages")
