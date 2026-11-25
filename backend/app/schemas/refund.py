from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class RefundCreate(BaseModel):
    order_id: str
    ticket_id: str
    amount: float
    reason: str
    idempotency_key: str

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class RefundReview(BaseModel):
    decision: str
    internal_note: Optional[str] = None

    @field_validator("decision")
    @classmethod
    def valid_decision(cls, v):
        if v not in ("approved", "rejected"):
            raise ValueError("Decision must be 'approved' or 'rejected'")
        return v

class RefundResponse(BaseModel):
    id: str
    order_id: str
    ticket_id: str
    amount: float
    reason: str
    status: str
    requested_by: str
    reviewed_by: Optional[str]
    idempotency_key: str
    created_at: datetime
    reviewed_at: Optional[datetime]

    model_config = {"from_attributes": True}
