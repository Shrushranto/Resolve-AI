from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class ChatRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_type: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
