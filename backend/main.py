from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.auth_router import router as auth_router
from routers.zones_router import router as zones_router, records_router
from seed import seed_database

app = FastAPI(
    title="Route53 Clone API",
    description="Mock AWS Route53 backend with SQLite persistence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
