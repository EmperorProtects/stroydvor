"""
FastAPI dependencies.

get_current_admin  — только role=admin (для /admin эндпоинтов)
get_current_user   — role=user ИЛИ role=admin с user-записью в БД
get_optional_user  — то же, но без исключения (возвращает None)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token
from app.core.database import get_database
from bson import ObjectId

oauth2_scheme          = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Admin guard ────────────────────────────────────────────────────────────────
def get_current_admin(token: str = Depends(oauth2_scheme)) -> str:
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin access required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("sub")


# ── Auth/me — работает для обоих типов токенов ────────────────────────────────
async def get_me(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Для admin-токена (sub=username) возвращает псевдо-объект {role:'admin'}.
    Для user-токена (sub=ObjectId) возвращает документ из БД.
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    role    = payload.get("role")
    sub     = payload.get("sub")

    # Admin-only токен (sub = username string, не ObjectId)
    if role == "admin" and not ObjectId.is_valid(sub):
        return {
            "id":         sub,
            "name":       "Администратор",
            "phone":      "",
            "email":      "",
            "role":       "admin",
            "is_blocked": False,
        }

    # User токен (sub = ObjectId)
    if not ObjectId.is_valid(sub):
        raise HTTPException(status_code=401, detail="Invalid token")

    db   = get_database()
    user = await db.users.find_one({"_id": ObjectId(sub)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")
    user["id"] = str(user.pop("_id"))
    user.pop("password", None)
    return user


# ── Current user (требует авторизации) ────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_access_token(token)
    if not payload or payload.get("role") not in ("user", "admin"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    sub = payload.get("sub")

    # Admin-only токен
    if payload.get("role") == "admin" and not ObjectId.is_valid(sub):
        raise HTTPException(status_code=403, detail="Use a user account for this endpoint")

    if not ObjectId.is_valid(sub):
        raise HTTPException(status_code=401, detail="Invalid token")

    db   = get_database()
    user = await db.users.find_one({"_id": ObjectId(sub)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")
    user["id"] = str(user.pop("_id"))
    user.pop("password", None)
    return user


# ── Optional user ─────────────────────────────────────────────────────────────
async def get_optional_user(token: str = Depends(oauth2_scheme_optional)) -> dict | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None

    sub  = payload.get("sub")
    role = payload.get("role")

    # Admin-only токен — не имеет user-записи
    if role == "admin" and not ObjectId.is_valid(sub):
        return None

    if not ObjectId.is_valid(sub):
        return None

    db   = get_database()
    user = await db.users.find_one({"_id": ObjectId(sub)})
    if not user or user.get("is_blocked"):
        return None
    user["id"] = str(user.pop("_id"))
    user.pop("password", None)
    return user
