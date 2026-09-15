# GridWatch — Production Power Grid Risk & Predictive Maintenance API

An enterprise-grade FastAPI backend system specializing in electrical transmission and distribution grid risk management, transformer asset health indexing, and automated dispatch intelligence.

---

## 🛠 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (>=0.110.0)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) (>=0.27.0)
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with SQLite (configurable to PostgreSQL)
- **Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/) (>=2.6.0)
- **Security & Auth**: [python-jose](https://github.com/mpdavis/python-jose) (JWT-ready architecture)
- **Client & Utilities**: [httpx](https://www.python-httpx.org/), [python-multipart](https://andrew-d.github.io/python-multipart/)

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch Development Server
```bash
uvicorn app.main:app --reload
```

*The application will automatically initialize the database schema and seed the initial dataset on first startup.*

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Gateway Health Check**: [http://localhost:8000/](http://localhost:8000/)

---

## 📡 Key API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/assets` | Retrieve all 20 assets with real-time risk tiers and health scores |
| `GET` | `/api/assets/{asset_id}` | Full telemetry, latest sensor packet, incidents, and maintenance plans |
| `POST` | `/api/assets` | Register a new transformer or grid asset into the network |
| `GET` | `/api/assets/{asset_id}/risk` | Compute or fetch real-time predictive failure assessment |
| `GET` | `/api/sensors/{asset_id}/history` | Timeseries sensor readings (voltage, current, oil temp, vibration, PF, load) |
| `GET` | `/api/predictions` | Active risk predictions across all grid infrastructure |
| `POST` | `/api/predictions/run` | Execute grid-wide batch recalculation of failure probabilities |
| `GET` | `/api/action-plan/actions` | Prioritized dispatcher action items (Immediate > Urgent > Medium) |
| `GET` | `/api/action-plan/brief` | Executive operator briefing with grid alert status and crew assignments |
| `GET` | `/api/weather/current` | Current meteorological conditions for North, South, East, West, Central zones |
| `GET` | `/api/incidents` | Incident logs with severity filtering (Critical, High, Medium, Low) |

---

## 📊 Seeded Data Summary

Upon initial launch, the system automatically validates if the database is populated. If empty, it creates:

1. **20 Grid Assets (`TX-101` to `TX-120`)**:
   - Geographically mapped across 5 grid sectors (North, South, East, West, Central).
   - **`TX-114`**: Substation Transformer under severe thermal distress (oil temp >100°C, 94% load) → Categorized as **`Critical`** risk (Health ~15-25%).
   - **`TX-107`**: Step-Up Transformer exhibiting excessive mechanical core vibration (>7.2 Hz) → Categorized as **`High`** risk (Health ~45-55%).
   - **`TX-119`**: Bulk Power Transformer subjected to lightning surge and phase voltage imbalance → Categorized as **`High`** risk (Health ~50-60%).
   - Remaining assets: Healthy operational baselines (**`Low`** risk) and moderate aging wear (**`Medium`** risk).
2. **30 Days of Chronological Telemetry**:
   - Over 3,600 historical sensor packets capturing voltage, current, winding/oil temperature, vibration, power factor, and percentage load.
3. **Multi-Zone Meteorological Observations**:
   - 30 days of weather telemetry tracking ambient heat, wind velocity, precipitation, solar irradiance, and active storm flags.
4. **12 Scripted Grid Incidents**:
   - Documented fault occurrences including thermal runaway, bushing partial discharge, cooling fan contactor trip, lightning arresters, and DGA gas accumulation.
5. **3 Tactical Maintenance Work Orders**:
   - Pre-configured work orders for `TX-114`, `TX-107`, and `TX-119` with assigned crew IDs, required spare parts, and time commitments.
