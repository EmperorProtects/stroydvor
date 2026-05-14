from pydantic_settings import BaseSettings
from typing import List
import secrets

class Settings(BaseSettings):
    MONGODB_URL:  str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "stroydvorkz"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    SECRET_KEY: str = secrets.token_hex(32)
    ACCESS_TOKEN_EXPIRE_MINUTES:  int = 480   # 8 часов
    REFRESH_TOKEN_EXPIRE_DAYS:    int = 30    # 30 дней

    # Admin (только для /admin панели)
    ADMIN_USERNAME:       str = "admin"
    ADMIN_PASSWORD_HASH:  str = ""
    ADMIN_PASSWORD_PLAIN: str = "admin123"

    # Email (опционально, для подтверждения регистрации)
    SMTP_HOST:     str = ""
    SMTP_PORT:     int = 587
    SMTP_USER:     str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM:    str = "noreply@stroydvor.kz"

    class Config:
        env_file = ".env"

settings = Settings()
