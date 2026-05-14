from fastapi import APIRouter, Depends, Header
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel

from app.core.database import get_database
from app.core.deps import get_optional_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


class FavoriteCreate(BaseModel):
    product_id:    str
    product_title: str
    product_image: Optional[str] = None
    product_price: float
    product_unit:  Optional[str] = None


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
async def list_favorites(
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    docs = await db.favorites.find(_owner_query(user, x_session_id)).to_list(200)
    return [_doc(d) for d in docs]


@router.post("/", status_code=201)
async def add_favorite(
    body: FavoriteCreate,
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = _owner_query(user, x_session_id)
    existing = await db.favorites.find_one({**q, "product_id": body.product_id})
    if existing:
        return _doc(existing)
    data = body.model_dump()
    data.update({**q, "created_date": datetime.now(timezone.utc)})
    result = await db.favorites.insert_one(data)
    created = await db.favorites.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.delete("/{fav_id}", status_code=204)
async def remove_favorite(
    fav_id: str,
    user: dict = Depends(get_optional_user),
    x_session_id: Optional[str] = Header(None),
):
    db = get_database()
    q = {**_owner_query(user, x_session_id), "_id": ObjectId(fav_id)}
    await db.favorites.delete_one(q)
