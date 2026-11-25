from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EscalationCreate(BaseModel):
    ticket_id: str
    summary: str
    priority: str = "medium"

class EscalationDecision(BaseModel):
    decision: str
    internal_note: Optional[str] = None

class EscalationResponse(BaseModel):
    id: str
    ticket_id: str
    summary: str
    priority: str
    assigned_to: Optional[str]
    decision: str
    internal_note: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}
