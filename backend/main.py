"""
main.py — DataLens AI backend entrypoint.
"""
import os

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import Base, engine
from routers import auth as auth_router
from routers import datasets as datasets_router
from routers import analysis as analysis_router
from routers import visualization as visualization_router
from routers import chat as chat_router
from routers import reports as reports_router
from routers import admin as admin_router
from routers import demo as demo_router

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Section 39 — never leak raw stack traces to the client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


@app.on_event("startup")
def on_startup():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Phase 1: create tables directly. A migrations tool (Alembic) is the
    # natural upgrade path once the schema stabilizes across phases.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


app.include_router(auth_router.router)
app.include_router(datasets_router.router)
app.include_router(analysis_router.router)
app.include_router(visualization_router.router)
app.include_router(chat_router.router)
app.include_router(reports_router.router)
app.include_router(admin_router.router)
app.include_router(demo_router.router)
