from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderResponse
from typing import List

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/", response_model=List[OrderResponse])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        return db.query(Order).filter(Order.customer_id == current_user.id).all()
    return db.query(Order).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
