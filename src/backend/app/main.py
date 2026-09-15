from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import action_plan, assets, incidents, predictions, sensors, weather
from .seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables and automatically seed data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="GridWatch Predictive Risk Engine API",
    description=(
        "Production-grade electrical power grid predictive maintenance, asset health scoring, "
        "and emergency dispatch decision-support backend."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for React and external dashboard integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register functional domain routers
app.include_router(assets.router)
app.include_router(sensors.router)
app.include_router(predictions.router)
app.include_router(action_plan.router)
app.include_router(weather.router)
app.include_router(incidents.router)


@app.get(
    "/",
    tags=["Root & Health"],
    summary="GridWatch API Gateway Health Check",
    description="Returns service availability, active engine version, and OpenAPI interactive documentation links.",
)
def root():
    return {
        "name": "GridWatch Predictive Risk Engine API",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "ok",
    }
