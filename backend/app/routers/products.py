from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.deps import get_current_admin
from app.models.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    localize_product, SUPPORTED_LANGS
)

router = APIRouter(prefix="/products", tags=["products"])


def _doc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    sort:        str            = Query("-created_date"),
    limit:       int            = Query(100, ge=1, le=2000),
    category:    Optional[str]  = None,
    subcategory: Optional[str]  = None,
    external_id: Optional[str]  = None,
    is_featured: Optional[bool] = None,
    is_sale:     Optional[bool] = None,
    in_stock:    Optional[bool] = None,
    search:      Optional[str]  = None,
    lang:        Optional[str]  = Query(None, description="Язык: ru | kz | en"),
):
    db = get_database()
    query: dict = {}

    if category:    query["category"]    = category
    if subcategory: query["subcategory"] = subcategory
    if external_id: query["external_id"] = external_id
    if is_featured is not None: query["is_featured"] = is_featured
    if is_sale     is not None: query["is_sale"]     = is_sale
    if in_stock    is not None: query["in_stock"]    = in_stock
    if search:
        query["$or"] = [
            {"title":       {"$regex": search, "$options": "i"}},
            {"title_ru":    {"$regex": search, "$options": "i"}},
            {"title_kz":    {"$regex": search, "$options": "i"}},
            {"title_en":    {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand":       {"$regex": search, "$options": "i"}},
            {"external_id": {"$regex": search, "$options": "i"}},
        ]

    descending     = sort.startswith("-")
    sort_field     = sort.lstrip("-")
    sort_direction = -1 if descending else 1

    cursor = db.products.find(query).sort(sort_field, sort_direction).limit(limit)
    docs   = await cursor.to_list(length=limit)
    docs   = [_doc(d) for d in docs]

    if lang and lang in SUPPORTED_LANGS:
        docs = [localize_product(d, lang) for d in docs]

    return docs


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    lang: Optional[str] = Query(None, description="Язык: ru | kz | en"),
):
    db = get_database()
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product ID")
    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(404, "Product not found")
    doc = _doc(doc)
    if lang and lang in SUPPORTED_LANGS:
        doc = localize_product(doc, lang)
    return doc


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, _: str = Depends(get_current_admin)):
    db = get_database()
    data = product.model_dump()
    # Если title_ru не задан — синхронизируем с title
    if not data.get("title_ru"):
        data["title_ru"] = data.get("title")
    data["created_date"] = datetime.now(timezone.utc)
    result  = await db.products.insert_one(data)
    created = await db.products.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductUpdate, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product ID")
    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Product not found")
    updated = await db.products.find_one({"_id": ObjectId(product_id)})
    return _doc(updated)


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product ID")
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Product not found")
