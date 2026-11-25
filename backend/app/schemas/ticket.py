from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "general"
    priority: str = "medium"
    order_id: Optional[str] = None

    @field_validator("category")
    @classmethod
    def valid_category(cls, v):
        if v not in ("refund", "delivery", "general", "technical", "billing"):
            raise ValueError("Invalid category")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v not in ("low", "medium", "high", "urgent"):
            raise ValueError("Invalid priority")
        return v

class TicketStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v not in ("open", "in_progress", "resolved", "closed"):
            raise ValueError("Invalid status")
        return v

class TicketResponse(BaseModel):
    id: str
    customer_id: str
    order_id: Optional[str]
    subject: str
    description: str
    category: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
