"""
Promocodes router — full CRUD, stored in MongoDB.
GET  /api/promocodes/              — admin only (list)
GET  /api/promocodes/validate/{code} — public (frontend checkout)
POST /api/promocodes/              — admin only
PATCH/DELETE /api/promocodes/{id}  — admin only
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.deps import get_current_admin
from app.models.schemas import (
    PromocodeCreate, PromocodeUpdate, PromocodeResponse, PromocodeValidateResponse
)

router = APIRouter(prefix="/promocodes", tags=["promocodes"])


def _doc(d: dict) -> dict:
    d["id"] = str(d.pop("_id"))
    return d


@router.get("/", response_model=List[PromocodeResponse])
async def list_promocodes(_: str = Depends(get_current_admin)):
    db = get_database()
    docs = await db.promocodes.find().sort("created_date", -1).to_list(500)
    return [_doc(d) for d in docs]


@router.get("/validate/{code}", response_model=PromocodeValidateResponse)
async def validate_promocode(code: str):
    """Public endpoint used by checkout to apply a promo code."""
    db = get_database()
    doc = await db.promocodes.find_one({"code": code.upper(), "active": True})
    if not doc:
        raise HTTPException(404, "Промокод не найден или неактивен")

    # Check expiry
    if doc.get("expires_at") and doc["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(400, "Срок действия промокода истёк")

    # Check usage limit
    if doc.get("max_uses") and doc.get("uses", 0) >= doc["max_uses"]:
        raise HTTPException(400, "Промокод исчерпан")

    return PromocodeValidateResponse(
        code=doc["code"],
        discount_type=doc["discount_type"],
        discount_value=doc["discount_value"],
        min_order=doc.get("min_order"),
    )


@router.post("/", response_model=PromocodeResponse, status_code=201)
async def create_promocode(
    body: PromocodeCreate,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    existing = await db.promocodes.find_one({"code": body.code.upper()})
    if existing:
        raise HTTPException(400, f"Код «{body.code}» уже существует")
    data = body.model_dump()
    data["code"] = data["code"].upper()
    data["uses"] = 0
    data["created_date"] = datetime.now(timezone.utc)
    result = await db.promocodes.insert_one(data)
    created = await db.promocodes.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.patch("/{promo_id}", response_model=PromocodeResponse)
async def update_promocode(
    promo_id: str,
    body: PromocodeUpdate,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    if not ObjectId.is_valid(promo_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    if "code" in update:
        update["code"] = update["code"].upper()
    if not update:
        raise HTTPException(400, "Nothing to update")
    await db.promocodes.update_one({"_id": ObjectId(promo_id)}, {"$set": update})
    doc = await db.promocodes.find_one({"_id": ObjectId(promo_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)


@router.delete("/{promo_id}", status_code=204)
async def delete_promocode(
    promo_id: str,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    if not ObjectId.is_valid(promo_id):
        raise HTTPException(400, "Invalid ID")
    await db.promocodes.delete_one({"_id": ObjectId(promo_id)})
