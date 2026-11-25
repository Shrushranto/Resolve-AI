from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    status: str
    delivery_date: Optional[date]
    total_amount: float
    category: str
    item_details: dict
    created_at: datetime

    model_config = {"from_attributes": True}
