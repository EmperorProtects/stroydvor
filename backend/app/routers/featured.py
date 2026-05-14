from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel
from app.core.database import get_database
from app.core.deps import get_current_admin

router = APIRouter(prefix="/featured-sections", tags=["featured"])

class SectionCreate(BaseModel):
    section_title: str
    product_ids: Optional[List[str]] = []
    is_active: bool = True
    sort_order: int = 0

class SectionUpdate(BaseModel):
    section_title: Optional[str] = None
    product_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class SectionResponse(BaseModel):
    id: str
    section_title: str
    product_ids: List[str] = []
    is_active: bool = True
    sort_order: int = 0
    created_date: datetime

def _doc(d):
    d["id"] = str(d.pop("_id"))
    return d

@router.get("/", response_model=List[SectionResponse])
async def list_sections():
    db = get_database()
    docs = await db.featured_sections.find().sort("sort_order", 1).to_list(100)
    return [_doc(d) for d in docs]

@router.post("/", response_model=SectionResponse, status_code=201)
async def create_section(body: SectionCreate, _: str = Depends(get_current_admin)):
    db = get_database()
    data = body.model_dump()
    data["created_date"] = datetime.now(timezone.utc)
    result = await db.featured_sections.insert_one(data)
    created = await db.featured_sections.find_one({"_id": result.inserted_id})
    return _doc(created)

@router.patch("/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, body: SectionUpdate, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(section_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    await db.featured_sections.update_one({"_id": ObjectId(section_id)}, {"$set": update})
    doc = await db.featured_sections.find_one({"_id": ObjectId(section_id)})
    return _doc(doc)

@router.delete("/{section_id}", status_code=204)
async def delete_section(section_id: str, _: str = Depends(get_current_admin)):
    db = get_database()
    if not ObjectId.is_valid(section_id):
        raise HTTPException(400, "Invalid ID")
    await db.featured_sections.delete_one({"_id": ObjectId(section_id)})
