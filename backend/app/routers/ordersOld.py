from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel

from app.core.database import get_database
from app.core.deps import get_current_admin, get_optional_user

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItem(BaseModel):
    product_id: str
    product_title: str
    quantity: float
    price: float
    unit: Optional[str] = "шт"


class OrderCreate(BaseModel):
    # Customer
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    comment: Optional[str] = None
    # Delivery & payment
    delivery_type: Optional[str] = "pickup"    # "delivery" | "pickup"
    payment_method: Optional[str] = "kaspi"    # "kaspi" | "remote" | "legal"
    # Items & pricing
    items: List[OrderItem] = []
    subtotal: float
    discount: float = 0
    delivery_cost: float = 0
    total: float
    promo_code: Optional[str] = None
    status: Optional[str] = "new"
    payment_status: Optional[str] = "pending"  # pending | paid | failed
    user_id: Optional[str] = None  # заполняется автоматически


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    comment: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    comment: Optional[str] = None
    delivery_type: Optional[str] = "pickup"
    payment_method: Optional[str] = "kaspi"
    items: List[OrderItem] = []
    subtotal: float = 0
    discount: float = 0
    delivery_cost: float = 0
    total: float = 0
    promo_code: Optional[str] = None
    status: str = "new"
    payment_status: Optional[str] = "pending"
    user_id: Optional[str] = None
    created_date: datetime

    model_config = {"from_attributes": True}


def _doc(d):
    d["id"] = str(d.pop("_id"))
    return d


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(
    order: OrderCreate,
    user: dict = Depends(get_optional_user),
):
    db = get_database()
    data = order.model_dump()
    if user:
        data["user_id"] = user["id"]
    data["created_date"] = datetime.now(timezone.utc)
    data["status"] = "new"

    # Validate promo via MongoDB
    if order.promo_code:
        promo = await db.promocodes.find_one({
            "code": order.promo_code.upper(),
            "active": True,
        })
        if not promo:
            raise HTTPException(400, "Промокод не найден или неактивен")
        if promo.get("expires_at") and promo["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(400, "Срок действия промокода истёк")
        if promo.get("max_uses") and promo.get("uses", 0) >= promo["max_uses"]:
            raise HTTPException(400, "Промокод исчерпан")
        if promo.get("min_order") and order.subtotal < promo["min_order"]:
            raise HTTPException(400, f"Минимальная сумма: {promo['min_order']} ₸")
        await db.promocodes.update_one({"_id": promo["_id"]}, {"$inc": {"uses": 1}})

    result = await db.orders.insert_one(data)
    created = await db.orders.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.get("/my")
async def my_orders(user: dict = Depends(get_optional_user)):
    """Заказы текущего пользователя."""
    db = get_database()
    if not user:
        return []
    docs = await db.orders.find({"user_id": user["id"]}).sort("created_date", -1).to_list(200)
    return [_doc(d) for d in docs]


@router.get("/", response_model=List[OrderResponse])
async def list_orders(_: str = Depends(get_current_admin)):
    db = get_database()
    docs = await db.orders.find().sort("created_date", -1).to_list(1000)
    return [_doc(d) for d in docs]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    db = get_database()
    if not ObjectId.is_valid(order_id):
        raise HTTPException(400, "Invalid ID")
    doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, body: OrderUpdate, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(order_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    if update:
        await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": update})
    doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)
