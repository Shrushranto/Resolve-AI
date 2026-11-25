import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, Date, Numeric, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "processing", "shipped", "delivered", "cancelled", name="order_status"),
        nullable=False, default="pending"
    )
    delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    item_details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped["User"] = relationship("User", back_populates="orders")
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="order")
    refunds: Mapped[list["Refund"]] = relationship("Refund", back_populates="order")
