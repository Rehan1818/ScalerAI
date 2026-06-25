import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.auth_router import router as auth_router
from routers.zones_router import router as zones_router, records_router
from seed import seed_database


def _allowed_origins() -> list[str]:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    if frontend_url := os.getenv("FRONTEND_URL", "").strip():
        origins.append(frontend_url.rstrip("/"))
    if extra := os.getenv("ALLOWED_ORIGINS", "").strip():
        origins.extend(origin.strip().rstrip("/") for origin in extra.split(",") if origin.strip())
    return list(dict.fromkeys(origins))


app = FastAPI(
    title="Route53 Clone API",
    description="Mock AWS Route53 backend with SQLite persistence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(zones_router)
app.include_router(records_router)


@app.on_event("startup")
def on_startup():
    seed_database()


@app.get("/api/health")
def health():
    return {"status": "ok"}
