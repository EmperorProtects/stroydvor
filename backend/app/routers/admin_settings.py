"""
Site settings router.
GET  /api/settings/   — public
PUT  /api/settings/   — admin only
"""
from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.database import get_database
from app.core.deps import get_current_admin

router = APIRouter(prefix="/settings", tags=["settings"])
SETTINGS_KEY = "site_settings"


class SiteSettings(BaseModel):
    company_name:    Optional[str] = "Строй-Двор"
    phone:           Optional[str] = ""
    phone_label:     Optional[str] = ""
    phone2:          Optional[str] = ""
    phone2_label:    Optional[str] = ""
    phone3:          Optional[str] = ""
    phone3_label:    Optional[str] = ""
    phone4:          Optional[str] = ""
    phone4_label:    Optional[str] = ""
    phone5:          Optional[str] = ""
    phone5_label:    Optional[str] = ""
    email:           Optional[str] = ""
    address:         Optional[str] = ""
    city:            Optional[str] = ""
    work_hours:      Optional[str] = ""
    whatsapp:        Optional[str] = ""
    instagram:       Optional[str] = ""
    map_link:        Optional[str] = ""
    description:     Optional[str] = ""
    description_ru:  Optional[str] = ""
    description_kz:  Optional[str] = ""
    description_en:  Optional[str] = ""
    # ── Новые поля ────────────────────────────────────────────────────────────
    # Ссылка Kaspi Pay для оплаты заказов
    kaspi_pay_link:  Optional[str] = "https://pay.kaspi.kz/pay/nbvnqerz"
    # Адрес самовывоза и ссылка 2GIS
    pickup_address:  Optional[str] = ""
    pickup_2gis_link: Optional[str] = ""


@router.get("/")
async def get_settings():
    db = get_database()
    doc = await db.site_settings.find_one({"_key": SETTINGS_KEY})
    if not doc:
        return SiteSettings().model_dump()
    doc.pop("_id", None)
    doc.pop("_key", None)
    doc.pop("updated_at", None)
    return doc


@router.put("/")
async def save_settings(body: SiteSettings, _: str = Depends(get_current_admin)):
    db = get_database()
    data = body.model_dump()
    data["_key"]       = SETTINGS_KEY
    data["updated_at"] = datetime.now(timezone.utc)
    await db.site_settings.replace_one({"_key": SETTINGS_KEY}, data, upsert=True)
    return {k: v for k, v in data.items() if k not in ("_key", "updated_at")}
