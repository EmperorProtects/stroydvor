"""
Auth router — admin login + user register/login/me/refresh/logout.

POST /api/auth/login          — admin login (username+password)
POST /api/auth/register       — user registration
POST /api/auth/user/login     — user login (phone или email + password)
GET  /api/auth/me             — текущий пользователь (user или admin)
POST /api/auth/refresh        — обновить access_token через refresh_token
POST /api/auth/logout         — выйти (invalidate refresh token)
PATCH /api/auth/me            — обновить профиль
PATCH /api/auth/me/password   — сменить пароль

Admin:
GET  /api/auth/users          — список пользователей
PATCH /api/auth/users/{id}    — блокировка / роль
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import re

from app.core.config   import settings
from app.core.database import get_database
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_access_token,
)
from app.core.deps import get_current_admin, get_current_user, get_me

router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class UserRegisterRequest(BaseModel):
    name:     str
    phone:    str
    email:    Optional[str] = None
    password: str

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 11 and digits[0] in ("7", "8"):
            return "+7" + digits[-10:]
        if len(digits) == 10:
            return "+7" + digits
        raise ValueError("Неверный формат телефона")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Пароль должен быть не менее 6 символов")
        return v

class UserLoginRequest(BaseModel):
    login:    str     # phone или email
    password: str

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          dict

class RefreshRequest(BaseModel):
    refresh_token: str

class UpdateProfileRequest(BaseModel):
    name:    Optional[str] = None
    email:   Optional[str] = None
    address: Optional[str] = None
    city:    Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_new(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Минимум 6 символов")
        return v

class AdminUpdateUserRequest(BaseModel):
    is_blocked: Optional[bool] = None
    role:       Optional[str]  = None   # "user" | "admin"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _user_public(user: dict) -> dict:
    """Возвращает безопасные поля пользователя (без пароля)."""
    return {
        "id":         str(user.get("id") or user.get("_id", "")),
        "name":       user.get("name", ""),
        "phone":      user.get("phone", ""),
        "email":      user.get("email", ""),
        "address":    user.get("address", ""),
        "city":       user.get("city", ""),
        "role":       user.get("role", "user"),
        "is_blocked": user.get("is_blocked", False),
        "created_at": user.get("created_at", "").isoformat() if hasattr(user.get("created_at"), "isoformat") else str(user.get("created_at", "")),
    }

async def _issue_tokens(user_id: str, role: str = "user") -> dict:
    access  = create_access_token({"sub": user_id, "role": role})
    refresh = create_refresh_token({"sub": user_id, "role": role})
    db = get_database()
    await db.refresh_tokens.insert_one({
        "user_id":    user_id,
        "token":      refresh,
        "created_at": datetime.now(timezone.utc),
    })
    return access, refresh


# ─── Admin login (unchanged interface) ────────────────────────────────────────

@router.post("/login")
async def admin_login(body: AdminLoginRequest):
    if body.username != settings.ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if settings.ADMIN_PASSWORD_HASH:
        ok = verify_password(body.password, settings.ADMIN_PASSWORD_HASH)
    else:
        ok = body.password == settings.ADMIN_PASSWORD_PLAIN
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": body.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
async def me(user: dict = Depends(get_me)):
    return _user_public(user)


# ─── User register ─────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: UserRegisterRequest):
    db = get_database()
    # Проверяем дубликат телефона
    if await db.users.find_one({"phone": body.phone}):
        raise HTTPException(status_code=409, detail="Этот номер телефона уже зарегистрирован")
    # Проверяем дубликат email
    if body.email and await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Этот email уже зарегистрирован")

    doc = {
        "name":        body.name.strip(),
        "phone":       body.phone,
        "email":       body.email or "",
        "password":    hash_password(body.password),
        "role":        "user",
        "is_blocked":  False,
        "address":     "",
        "city":        "",
        "created_at":  datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    access, refresh = await _issue_tokens(user_id)
    user_doc = await db.users.find_one({"_id": result.inserted_id})
    user_doc["id"] = user_id

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=_user_public(user_doc),
    )


# ─── User login ────────────────────────────────────────────────────────────────

@router.post("/user/login")
async def user_login(body: UserLoginRequest):
    db = get_database()
    login = body.login.strip()

    # Нормализуем если похоже на телефон
    digits = re.sub(r"\D", "", login)
    if len(digits) >= 10:
        if len(digits) == 11 and digits[0] in ("7", "8"):
            phone = "+7" + digits[-10:]
        else:
            phone = "+7" + digits[-10:]
        user = await db.users.find_one({"phone": phone})
    else:
        user = await db.users.find_one({"email": login})

    if not user or not verify_password(body.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    user_id = str(user["_id"])
    access, refresh = await _issue_tokens(user_id, role=user.get("role", "user"))
    user["id"] = user_id

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=_user_public(user),
    )


# ─── Refresh token ─────────────────────────────────────────────────────────────

@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    payload = decode_access_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    db = get_database()
    stored = await db.refresh_tokens.find_one({"token": body.refresh_token})
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    user_id = payload.get("sub")
    role    = payload.get("role", "user")
    access  = create_access_token({"sub": user_id, "role": role})
    return {"access_token": access, "token_type": "bearer"}


# ─── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(body: RefreshRequest):
    db = get_database()
    await db.refresh_tokens.delete_one({"token": body.refresh_token})
    return {"ok": True}


# ─── Update profile ────────────────────────────────────────────────────────────

@router.patch("/me")
async def update_profile(body: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    db = get_database()
    upd = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not upd:
        return _user_public(user)
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": upd})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])})
    updated["id"] = user["id"]
    return _user_public(updated)


# ─── Change password ───────────────────────────────────────────────────────────

@router.patch("/me/password")
async def change_password(body: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    db = get_database()
    full = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not verify_password(body.old_password, full.get("password", "")):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password": hash_password(body.new_password)}}
    )
    return {"ok": True}


# ─── Admin: список пользователей ──────────────────────────────────────────────

@router.get("/users")
async def list_users(_: str = Depends(get_current_admin)):
    db = get_database()
    docs = await db.users.find().sort("created_at", -1).to_list(1000)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("password", None)
    return docs

@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: AdminUpdateUserRequest, _: str = Depends(get_current_admin)):
    db = get_database()
    upd = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not upd:
        raise HTTPException(400, "Nothing to update")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": upd})
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password", None)
    return doc
