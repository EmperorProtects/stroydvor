from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routers import (
    products, cart, orders, consultations, banners,
    auth, categories, promocodes,
    favorites, featured, delivery, admin_settings
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Стройдворк API",
    version="2.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,              prefix="/api")
app.include_router(products.router,          prefix="/api")
app.include_router(categories.router,        prefix="/api")
app.include_router(promocodes.router,        prefix="/api")
app.include_router(cart.router,              prefix="/api")
app.include_router(orders.router,            prefix="/api")
app.include_router(consultations.router,     prefix="/api")
app.include_router(banners.router,           prefix="/api")
app.include_router(favorites.router,         prefix="/api")
app.include_router(featured.router,          prefix="/api")
app.include_router(delivery.router,          prefix="/api")
app.include_router(admin_settings.router,          prefix="/api")


@app.get("/")
async def root():
    return {"message": "Стройдворк API v2.1", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok"}
