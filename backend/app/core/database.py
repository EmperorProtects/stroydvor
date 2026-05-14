from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient = None
_db = None


def get_database():
    return _db


async def connect_to_mongo():
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _db = _client[settings.DATABASE_NAME]
    await _create_indexes()
    print(f"✅ MongoDB connected: {settings.DATABASE_NAME}")


async def _create_indexes():
    """Создаём все индексы при старте."""
    db = _db

    # Users
    await db.users.create_index("phone",  unique=True, sparse=True)
    await db.users.create_index("email",  unique=True, sparse=True)
    await db.users.create_index("created_at")

    # Refresh tokens
    await db.refresh_tokens.create_index("token",   unique=True)
    await db.refresh_tokens.create_index("user_id")
    await db.refresh_tokens.create_index(
        "created_at",
        expireAfterSeconds=60 * 60 * 24 * 31  # авто-удаление через 31 день
    )

    # Products — text search
    try:
        await db.products.create_index([
            ("title_ru", "text"), ("title_kz", "text"), ("title_en", "text"),
            ("description_ru", "text"), ("brand", "text"), ("external_id", "text"),
        ], weights={"title_ru": 10, "title_kz": 10, "title_en": 10,
                    "brand": 5, "description_ru": 2, "external_id": 8},
           name="products_text_search")
    except Exception:
        pass  # индекс уже существует

    await db.products.create_index("category")
    await db.products.create_index("external_id")
    await db.products.create_index([("category", 1), ("subcategory", 1)])

    # Cart & Favorites — по владельцу
    await db.cart_items.create_index("user_id",    sparse=True)
    await db.cart_items.create_index("session_id", sparse=True)
    await db.favorites.create_index( "user_id",    sparse=True)
    await db.favorites.create_index( "session_id", sparse=True)

    # Orders
    await db.orders.create_index("user_id",      sparse=True)
    await db.orders.create_index("created_date")
    await db.orders.create_index("status")

    # Categories & Banners
    await db.categories.create_index("slug",       unique=True, sparse=True)
    await db.categories.create_index("sort_order")
    await db.banners.create_index(   "sort_order")


async def close_mongo_connection():
    global _client
    if _client:
        _client.close()
        print("MongoDB disconnected")
