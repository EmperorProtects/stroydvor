from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.deps import get_current_admin
from app.models.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    localize_category, SUPPORTED_LANGS
)

router = APIRouter(prefix="/categories", tags=["categories"])


def _doc(d: dict) -> dict:
    d["id"] = str(d.pop("_id"))
    return d


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    lang: Optional[str] = Query(None, description="Язык: ru | kz | en"),
):
    db = get_database()
    docs = await db.categories.find().sort("sort_order", 1).to_list(500)
    docs = [_doc(d) for d in docs]
    if lang and lang in SUPPORTED_LANGS:
        docs = [localize_category(d, lang) for d in docs]
    return docs


@router.get("/{cat_id}", response_model=CategoryResponse)
async def get_category(
    cat_id: str,
    lang: Optional[str] = Query(None, description="Язык: ru | kz | en"),
):
    db = get_database()
    if ObjectId.is_valid(cat_id):
        doc = await db.categories.find_one({"_id": ObjectId(cat_id)})
    else:
        doc = await db.categories.find_one({"slug": cat_id})
    if not doc:
        raise HTTPException(404, "Category not found")
    doc = _doc(doc)
    if lang and lang in SUPPORTED_LANGS:
        doc = localize_category(doc, lang)
    return doc


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(body: CategoryCreate, _: str = Depends(get_current_admin)):
    db = get_database()
    data = body.model_dump()
    if not data.get("slug"):
        import re
        data["slug"] = re.sub(r"[^a-zа-яё0-9-]", "", body.name.lower().replace(" ", "-"))
    # Синхронизируем name_ru с name если не задан
    if not data.get("name_ru"):
        data["name_ru"] = data.get("name")
    data["created_date"] = datetime.now(timezone.utc)
    result = await db.categories.insert_one(data)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.patch("/{cat_id}", response_model=CategoryResponse)
async def update_category(cat_id: str, body: CategoryUpdate, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(cat_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(400, "Nothing to update")
    await db.categories.update_one({"_id": ObjectId(cat_id)}, {"$set": update})
    doc = await db.categories.find_one({"_id": ObjectId(cat_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)


@router.delete("/{cat_id}", status_code=204)
async def delete_category(cat_id: str, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(cat_id):
        raise HTTPException(400, "Invalid ID")
    await db.categories.delete_one({"_id": ObjectId(cat_id)})
