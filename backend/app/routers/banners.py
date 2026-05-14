"""
banners router — поддержка i18n (RU / KZ / EN).

Типы баннеров:
  slider      — главный слайдер (HeroBanner)
  promo_card  — мини-карточки под слайдером (HeroBanner)
  promo_top   — большой промо-баннер «Акция месяца» (PromoBanner variant=top)
  promo_bottom— пара карточек внизу (PromoBanner variant=bottom)

Поля i18n для каждого баннера:
  title / title_ru / title_kz / title_en
  subtitle / subtitle_ru / subtitle_kz / subtitle_en
  cta_text / cta_text_ru / cta_text_kz / cta_text_en
  badge_text / badge_text_ru / badge_text_kz / badge_text_en
  price_label / price_label_ru / price_label_kz / price_label_en  (только promo_top)

Query param ?lang=ru|kz|en → бэкенд подставляет нужный язык в title/subtitle/cta_text/badge_text
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel

from app.core.database import get_database
from app.core.deps import get_current_admin

router = APIRouter(prefix="/banners", tags=["banners"])

SUPPORTED_LANGS = ("ru", "kz", "en")


# ─── i18n helper ──────────────────────────────────────────────────────────────
def _i18n(doc: dict, field: str, lang: str) -> Optional[str]:
    """Возвращает локализованное значение поля с fallback → ru → основное."""
    val = doc.get(f"{field}_{lang}")
    if val:
        return val
    val = doc.get(f"{field}_ru")
    if val:
        return val
    return doc.get(field)


def localize_banner(doc: dict, lang: str) -> dict:
    if lang not in SUPPORTED_LANGS:
        lang = "ru"
    out = dict(doc)
    for field in ("title", "subtitle", "cta_text", "badge_text",
                  "price_label"):
        out[field] = _i18n(doc, field, lang)
    out["lang"] = lang
    return out


# ─── Pydantic models ──────────────────────────────────────────────────────────
class BannerCreate(BaseModel):
    type: Optional[str] = "slider"   # slider | promo_card | promo_top | promo_bottom

    # i18n: title
    title: str
    title_ru: Optional[str] = None
    title_kz: Optional[str] = None
    title_en: Optional[str] = None

    # i18n: subtitle
    subtitle: Optional[str] = None
    subtitle_ru: Optional[str] = None
    subtitle_kz: Optional[str] = None
    subtitle_en: Optional[str] = None

    # i18n: cta_text
    cta_text: Optional[str] = None
    cta_text_ru: Optional[str] = None
    cta_text_kz: Optional[str] = None
    cta_text_en: Optional[str] = None

    # i18n: badge_text
    badge_text: Optional[str] = None
    badge_text_ru: Optional[str] = None
    badge_text_kz: Optional[str] = None
    badge_text_en: Optional[str] = None

    # i18n: price_label (для promo_top)
    price_label: Optional[str] = None
    price_label_ru: Optional[str] = None
    price_label_kz: Optional[str] = None
    price_label_en: Optional[str] = None

    # Нелокализованные поля
    cta_link: Optional[str] = "/catalog"
    price_value: Optional[str] = None
    price_unit: Optional[str] = None
    image_url: Optional[str] = None
    bg_color: Optional[str] = "#1A1A1A"
    text_color: Optional[str] = "#ffffff"
    is_active: bool = True
    sort_order: int = 0
    slot: Optional[str] = None         # backward compat
    accent_color: Optional[str] = None # backward compat


class BannerUpdate(BaseModel):
    type: Optional[str] = None

    title: Optional[str] = None
    title_ru: Optional[str] = None
    title_kz: Optional[str] = None
    title_en: Optional[str] = None

    subtitle: Optional[str] = None
    subtitle_ru: Optional[str] = None
    subtitle_kz: Optional[str] = None
    subtitle_en: Optional[str] = None

    cta_text: Optional[str] = None
    cta_text_ru: Optional[str] = None
    cta_text_kz: Optional[str] = None
    cta_text_en: Optional[str] = None

    badge_text: Optional[str] = None
    badge_text_ru: Optional[str] = None
    badge_text_kz: Optional[str] = None
    badge_text_en: Optional[str] = None

    price_label: Optional[str] = None
    price_label_ru: Optional[str] = None
    price_label_kz: Optional[str] = None
    price_label_en: Optional[str] = None

    cta_link: Optional[str] = None
    price_value: Optional[str] = None
    price_unit: Optional[str] = None
    image_url: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class BannerResponse(BaseModel):
    id: str
    type: Optional[str] = "slider"

    title: Optional[str] = None
    title_ru: Optional[str] = None
    title_kz: Optional[str] = None
    title_en: Optional[str] = None

    subtitle: Optional[str] = None
    subtitle_ru: Optional[str] = None
    subtitle_kz: Optional[str] = None
    subtitle_en: Optional[str] = None

    cta_text: Optional[str] = None
    cta_text_ru: Optional[str] = None
    cta_text_kz: Optional[str] = None
    cta_text_en: Optional[str] = None

    badge_text: Optional[str] = None
    badge_text_ru: Optional[str] = None
    badge_text_kz: Optional[str] = None
    badge_text_en: Optional[str] = None

    price_label: Optional[str] = None
    price_label_ru: Optional[str] = None
    price_label_kz: Optional[str] = None
    price_label_en: Optional[str] = None

    cta_link: Optional[str] = None
    price_value: Optional[str] = None
    price_unit: Optional[str] = None
    image_url: Optional[str] = None
    bg_color: Optional[str] = "#1A1A1A"
    text_color: Optional[str] = "#ffffff"
    is_active: bool = True
    sort_order: int = 0
    slot: Optional[str] = None
    accent_color: Optional[str] = None
    updated_at: Optional[datetime] = None
    lang: Optional[str] = None


def _doc(d: dict) -> dict:
    d["id"] = str(d.pop("_id"))
    return d


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[BannerResponse])
async def list_banners(
    lang: Optional[str] = Query(None, description="Язык: ru | kz | en"),
):
    db = get_database()
    docs = await db.banners.find().sort("sort_order", 1).to_list(100)
    docs = [_doc(d) for d in docs]
    if lang and lang in SUPPORTED_LANGS:
        docs = [localize_banner(d, lang) for d in docs]
    return docs


@router.post("/", response_model=BannerResponse, status_code=201)
async def create_banner(body: BannerCreate, _: str = Depends(get_current_admin)):
    db = get_database()
    data = body.model_dump()
    # Синхронизируем _ru с основным полем если не задан
    for f in ("title", "subtitle", "cta_text", "badge_text", "price_label"):
        if not data.get(f"{f}_ru"):
            data[f"{f}_ru"] = data.get(f)
    data["updated_at"] = datetime.now(timezone.utc)
    result = await db.banners.insert_one(data)
    created = await db.banners.find_one({"_id": result.inserted_id})
    return _doc(created)


@router.patch("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: str,
    body: BannerUpdate,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    query = {"_id": ObjectId(banner_id)} if ObjectId.is_valid(banner_id) else {"slot": banner_id}
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc)
    await db.banners.update_one(query, {"$set": update})
    doc = await db.banners.find_one(query)
    if not doc:
        raise HTTPException(404, "Banner not found")
    return _doc(doc)


@router.delete("/{banner_id}", status_code=204)
async def delete_banner(banner_id: str, _: str = Depends(get_current_admin)):
    db = get_database()
    if ObjectId.is_valid(banner_id):
        await db.banners.delete_one({"_id": ObjectId(banner_id)})
    else:
        await db.banners.delete_one({"slot": banner_id})


# ── Legacy slot endpoints (backward compat) ───────────────────────────────────
@router.get("/{slot}", response_model=BannerResponse)
async def get_banner_by_slot(
    slot: str,
    lang: Optional[str] = Query(None),
):
    db = get_database()
    doc = await db.banners.find_one(
        {"_id": ObjectId(slot)} if ObjectId.is_valid(slot) else {"slot": slot}
    )
    if not doc:
        raise HTTPException(404, "Banner not found")
    doc = _doc(doc)
    if lang and lang in SUPPORTED_LANGS:
        doc = localize_banner(doc, lang)
    return doc


@router.put("/{slot}", response_model=BannerResponse)
async def upsert_banner_by_slot(
    slot: str,
    body: BannerCreate,
    _: str = Depends(get_current_admin),
):
    db = get_database()
    data = body.model_dump()
    data["slot"] = slot
    data["updated_at"] = datetime.now(timezone.utc)
    for f in ("title", "subtitle", "cta_text", "badge_text"):
        if not data.get(f"{f}_ru"):
            data[f"{f}_ru"] = data.get(f)
    result = await db.banners.find_one_and_replace(
        {"slot": slot}, data, upsert=True, return_document=True
    )
    return _doc(result)
