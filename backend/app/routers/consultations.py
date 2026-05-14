"""
Consultations (leads from site forms).
POST /api/consultations/            — public (site forms)
GET  /api/consultations/            — admin only
PATCH /api/consultations/{id}       — admin only (status update)
DELETE /api/consultations/{id}      — admin only
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from app.core.database import get_database
from app.core.deps import get_current_admin
from app.models.schemas import ConsultationRequest, ConsultationResponse, ConsultationUpdate

router = APIRouter(prefix="/consultations", tags=["consultations"])


def _doc(d: dict) -> dict:
    d["id"] = str(d.pop("_id"))
    return d


@router.post("/", response_model=ConsultationResponse, status_code=201)
async def create_consultation(request: ConsultationRequest):
    db = get_database()
    data = request.model_dump()
    data["created_date"] = datetime.now(timezone.utc)
    data["status"] = "new"
    result = await db.consultations.insert_one(data)
    created = await db.consultations.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.get("/", response_model=List[ConsultationResponse])
async def list_consultations(_: str = Depends(get_current_admin)):
    db = get_database()
    docs = await db.consultations.find().sort("created_date", -1).to_list(500)
    return [_doc(d) for d in docs]


@router.patch("/{lead_id}", response_model=ConsultationResponse)
async def update_consultation(
    lead_id: str,
    body: ConsultationUpdate,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(400, "Invalid ID")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(400, "Nothing to update")
    await db.consultations.update_one({"_id": ObjectId(lead_id)}, {"$set": update})
    doc = await db.consultations.find_one({"_id": ObjectId(lead_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return _doc(doc)


@router.delete("/{lead_id}", status_code=204)
async def delete_consultation(
    lead_id: str,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(400, "Invalid ID")
    await db.consultations.delete_one({"_id": ObjectId(lead_id)})
