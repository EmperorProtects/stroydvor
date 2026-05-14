"""
Cart — привязан к user_id если пользователь залогинен,
иначе к session_id из заголовка X-Session-Id.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel

from app.core.database import get_database
from app.core.deps import get_optional_user

router = APIRouter(prefix="/cart", tags=["cart"])


class CartItemCreate(BaseModel):
    product_id:    str
    product_title: str
    product_image: Optional[str] = None
    product_price: float
    quantity:      float = 1
    unit:          Optional[str] = "шт"

class CartItemUpdate(BaseModel):
    quantity: Optional[float] = None


def _doc(d):
    d["id"] = str(d.pop("_id"))
    return d

def _owner_query(user, session_id):
    if user:
        return {"user_id": user["id"]}
    if session_id:
        return {"session_id": session_id}
    return {"session_id": "__none__"}


@router.get("/")
async def list_cart(
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = _owner_query(user, x_session_id)
    items = await db.cart_items.find(q).sort("created_date", 1).to_list(200)
    return [_doc(i) for i in items]


@router.post("/", status_code=201)
async def add_to_cart(
    body: CartItemCreate,
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = _owner_query(user, x_session_id)
    # Если уже есть — увеличим количество
    existing = await db.cart_items.find_one({**q, "product_id": body.product_id})
    if existing:
        await db.cart_items.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"quantity": body.quantity}}
        )
        updated = await db.cart_items.find_one({"_id": existing["_id"]})
        return _doc(updated)
    data = body.model_dump()
    data.update({**q, "created_date": datetime.now(timezone.utc)})
    result = await db.cart_items.insert_one(data)
    created = await db.cart_items.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.patch("/{item_id}")
async def update_cart_item(
    item_id: str,
    body: CartItemUpdate,
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = {**_owner_query(user, x_session_id), "_id": ObjectId(item_id)}
    upd = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    await db.cart_items.update_one(q, {"$set": upd})
    doc = await db.cart_items.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)


@router.delete("/{item_id}", status_code=204)
async def delete_cart_item(
    item_id: str,
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = {**_owner_query(user, x_session_id), "_id": ObjectId(item_id)}
    await db.cart_items.delete_one(q)


@router.delete("/", status_code=204)
async def clear_cart(
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    await db.cart_items.delete_many(_owner_query(user, x_session_id))
