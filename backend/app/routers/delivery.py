from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel
from app.core.database import get_database
from app.core.deps import get_current_admin

router = APIRouter(prefix="/delivery-settings", tags=["delivery"])

class DeliveryCreate(BaseModel):
    name: str
    price_from: float = 0
    price_to: float = 0
    free_from: float = 0
    is_active: bool = True

class DeliveryUpdate(BaseModel):
    name: Optional[str] = None
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    free_from: Optional[float] = None
    is_active: Optional[bool] = None

class DeliveryResponse(DeliveryCreate):
    id: str
    created_date: datetime

def _doc(d):
    d["id"] = str(d.pop("_id"))
    return d

@router.get("/", response_model=List[DeliveryResponse])
async def list_delivery():
    db = get_database()
    docs = await db.delivery_settings.find().sort("created_date", 1).to_list(50)
    return [_doc(d) for d in docs]

@router.post("/", response_model=DeliveryResponse, status_code=201)
async def create_delivery(body: DeliveryCreate, _: str = Depends(get_current_admin)):
    db = get_database()
    data = body.model_dump()
    data["created_date"] = datetime.now(timezone.utc)
    result = await db.delivery_settings.insert_one(data)
    created = await db.delivery_settings.find_one({"_id": result.inserted_id})
    return _doc(created)

@router.patch("/{item_id}", response_model=DeliveryResponse)
async def update_delivery(item_id: str, body: DeliveryUpdate, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    await db.delivery_settings.update_one({"_id": ObjectId(item_id)}, {"$set": update})
    doc = await db.delivery_settings.find_one({"_id": ObjectId(item_id)})
    return _doc(doc)

@router.delete("/{item_id}", status_code=204)
async def delete_delivery(item_id: str, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid ID")
    await db.delivery_settings.delete_one({"_id": ObjectId(item_id)})
