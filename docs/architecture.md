# Architecture

## System Architecture

GridWatch AI follows a clean client-server architecture with a deterministic risk computation engine.

```mermaid
graph TD
    A[Grid Operator / Browser] -->|HTTPS| B[React Frontend - Vite/TypeScript]
    B -->|REST API / Axios| C[FastAPI Backend]
    C -->|SQLAlchemy 2.0 ORM| D[SQLite Database\ngrid_watch.db]
    C -->|Risk Engine| E[Risk Computation Services]
    E --> F[Thermal Stress Calculator]
    E --> G[Electrical Stress Calculator]
    E --> H[Mechanical Stress Calculator]
    E --> I[Environmental Stress Calculator]
    E --> J[Composite Health Score (AHI)]
    E --> K[Failure Probability & Risk Tier]
    C -->|Brief Generator| L[Action Items & Crew Plans]
    L --> M[Prioritized Action Items]
    L --> N[Crew Deployment Roster]
    L --> O[Executive Operator Brief]
    
    subgraph "Data Layer (Seeded at Startup)"
    P[20 Assets\nTX-101 to TX-120]
    Q[3,600+ Sensor Readings\n30 days × 20 assets]
    R[1,200 Weather Records\n30 days × 5 zones]
    S[12 Grid Incidents\nThermal, DGA, Vibration, Lightning]
    T[3 Maintenance Plans\nCrews, Parts, Schedule]
    end
    
    P --> D
    Q --> D
    R --> D
    S --> D
    T --> D
```

## Components

| Component | Technology | Responsibility |
|---|---|---|
| **Frontend UI** | React 18, TypeScript, Vite | Dashboard, Risk Map (Leaflet), Fleet table, Asset Detail charts (Recharts), Action Plan |
| **Styling** | Tailwind CSS | Dark-theme "night/volt" design system, responsive grid, risk-color coding |
| **State/ Routing** | React Router v6 | SPA navigation, protected routes, asset detail params |
| **API Client** | Axios | Typed API calls, interceptors, 15s timeout, base URL from env |
| **Backend API** | FastAPI 0.110+ | REST endpoints, auto OpenAPI docs, CORS, lifespan startup seeding |
| **Database ORM** | SQLAlchemy 2.0 | Declarative models, async-compatible sessions, relationship loading |
| **Database** | SQLite (file) | Zero-config, portable, 5 tables, 5,000+ seeded rows |
| **Validation** | Pydantic v2 | Request/response schemas, type coercion, field constraints |
| **Risk Engine** | Pure Python (services/risk_engine.py) | 4 stress calculators, AHI formula, failure probability, risk tier mapping |
| **Brief Generator** | Pure Python (services/brief_generator.py) | Action items, crew plans, executive brief synthesis |
| **Seeding** | Python (seed_data.py) | Idempotent database initialization with realistic synthetic data |

## Data Flow

1. **Startup**: FastAPI `lifespan` → `Base.metadata.create_all()` → `seed_database()` → 20 assets, 3,600 readings, 1,200 weather, 12 incidents, 3 plans, 20 risk predictions
2. **Frontend Load**: React mounts → `getOperatorBrief()` → `/api/action-plan/brief` → `generate_brief()` → queries latest predictions for all assets → returns grid status + counts + actions + crews + summary
3. **Dashboard**: Parallel calls to `/api/assets` (list with risk), `/api/incidents` (recent), `/api/weather/current` (zone conditions)
4. **Risk Map**: `/api/assets` → Leaflet markers colored by risk_level → click → `/api/assets/{id}` → AssetDetail modal
5. **Fleet**: `/api/assets?zone=X&status=Y` → filterable/sortable table with health scores
6. **Asset Detail**: `/api/assets/{id}` → telemetry charts (Recharts line/area), incident timeline, maintenance plans
7. **Action Plan**: `/api/action-plan/actions` + `/api/action-plan/brief` → prioritized lists
8. **On-Demand Recalculation**: POST `/api/predictions/run` → `run_all_predictions()` → recomputes all 20 assets → persists new RiskPrediction rows

## Security Considerations

- **CORS**: Configured for `allow_origins=["*"]` for hackathon demo; production would restrict to frontend origin
- **Authentication**: Not implemented (hackathon scope); login page is branded landing only
- **Secrets**: No API keys, tokens, or credentials in codebase; `.env` files gitignored
- **Database**: SQLite file excluded via `.gitignore`; seeded data is synthetic
- **Input Validation**: Pydantic schemas on all POST/PUT endpoints with field constraints

## Scalability Notes

- **Stateless Backend**: FastAPI workers can scale horizontally behind a load balancer
- **Database**: SQLite is single-writer; production would migrate to PostgreSQL with connection pooling
- **Risk Engine**: Pure Python, CPU-bound; could be extracted to a separate worker pool (Celery/RQ) for 10,000+ assets
- **Caching**: Prediction results could be cached (Redis) with TTL for high-frequency polling
- **Real-time**: WebSocket push for live risk updates would replace 60-second polling
- **IBM Cloud Deployment**: Containerize with Docker → deploy to Code Engine or OpenShift; use watsonx.ai for ML-enhanced risk models