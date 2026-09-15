# GridWatch AI — Predictive Power Grid Risk Engine

> ⚡ **Real-time transformer health monitoring, failure prediction, and dispatcher intelligence for electrical power grids.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Cognitive Coders |
| **Track** | AI |
| **Team Lead** | Dhruvin Tank — dhruvin.tank@ibm.com |
| **Members** | Team Member 1, Team Member 2 |

---

## 🎯 Problem Statement

Grid operators lack real-time predictive visibility into transformer health across transmission networks. Current monitoring is **reactive**, **fragmented** across SCADA/weather/incident silos, and relies on **subjective engineer judgment** — leading to unplanned outages costing **$100K+/hour** and cascading failure risk from aging infrastructure (70% of US transformers >25 years old).

---

## 💡 Solution

**GridWatch AI** fuses live SCADA telemetry, multi-zone weather, and incident history into a **deterministic risk engine** that computes an **Asset Health Index (AHI)** for 20 transformers every 60 seconds. It outputs:
- **Failure probability** & **risk tiers** (Critical/High/Medium/Low)
- **Time-to-failure estimates** with named primary risk factors
- **Prioritized dispatcher action plans** (Immediate > Urgent > Medium) with crew assignments
- **Executive operator brief** with grid status (NOMINAL/ELEVATED_RISK/CRITICAL_ALERT)

All via a modern React dashboard and FastAPI backend with **zero external ML dependencies**.

---

## ✨ Key Features

- **Real-time Asset Health Index (AHI)** — Thermal, electrical, mechanical, and environmental stress fusion into a 0–100 score
- **Failure probability & risk tier classification** — Critical/High/Medium/Low with time-to-failure estimates
- **Prioritized dispatcher action plans** — Immediate/Urgent/Medium actions with crew assignments and parts kits
- **Executive operator brief** — Grid status, asset counts, natural-language summary, crew deployment roster
- **Interactive visualizations** — Risk Map (Leaflet), Fleet table, telemetry charts (Recharts), incident timelines

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, TypeScript |
| **Frameworks** | FastAPI, React, Vite, Tailwind CSS |
| **IBM Technologies** | watsonx.ai (architecture-ready), IBM Bob (MCP-compatible API design) |
| **Databases** | SQLite (SQLAlchemy 2.0) |
| **Other** | Leaflet, Recharts, Axios, Pydantic v2, Uvicorn |

---

## 📁 Repository Structure

```
bob-ai-hackathon-Cognitive-Coders/
│
├── .github/
│   └── workflows/validate.yml       # Automated submission validator
│
├── src/
│   ├── backend/                     # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app + lifespan seeding
│   │   │   ├── database.py          # SQLAlchemy config (env-configurable DB path)
│   │   │   ├── models.py            # SQLAlchemy models (Asset, Sensor, Weather, Incident, Plan, Prediction)
│   │   │   ├── schemas.py           # Pydantic request/response schemas
│   │   │   ├── seed_data.py         # 30-day synthetic dataset generator
│   │   │   ├── routers/             # API endpoints
│   │   │   │   ├── assets.py
│   │   │   │   ├── sensors.py
│   │   │   │   ├── predictions.py
│   │   │   │   ├── weather.py
│   │   │   │   ├── incidents.py
│   │   │   │   └── action_plan.py
│   │   │   └── services/
│   │   │       ├── risk_engine.py   # 4 stress calculators + AHI + failure prob
│   │   │       └── brief_generator.py # Action items, crew plans, operator brief
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── grid_watch.db            # SQLite database (gitignored)
│   │
│   └── frontend/                    # React + Vite + TypeScript
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx              # Routing (Login, Dashboard, Map, Fleet, AssetDetail, ActionPlan)
│       │   ├── index.css
│       │   ├── api/                 # Typed API client
│       │   │   ├── client.ts
│       │   │   └── gridApi.ts
│       │   ├── types/grid.ts        # TypeScript interfaces
│       │   ├── components/          # Layout, Sidebar, KpiCard, RiskBadge, states
│       │   └── pages/               # Dashboard, RiskMap, Fleet, AssetDetail, ActionPlan, Login
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       ├── .env.example
│       └── index.html
│
├── docs/
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
│
├── demo/
│   ├── screenshots/                 # App screenshots (add 3+)
│   ├── demo-video-link.txt          # ← Add your Loom/YouTube URL here
│   └── live-demo-url.txt            # ← Add deployed URL or "NOT DEPLOYED"
│
├── presentation/
│   └── slides.pdf                   # ← Add your slide deck here
│
├── submission.yaml                  # Structured metadata (read by evaluators)
├── README.md                        # This file
├── CONTRIBUTING.md                  # Template contribution guide
└── .gitignore
```

---

## ⚡ How to Run

> **Exact commands from `docs/setup-guide.md`**

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### Backend (Terminal 1)

```bash
cd src/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env if needed (default GRIDWATCH_DB_PATH=sqlite:///./grid_watch.db works)

uvicorn app.main:app --reload --port 8000
```

**Backend URLs:**
- API: http://localhost:8000/
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend (Terminal 2)

```bash
cd src/frontend
npm install
cp .env.example .env
npm run dev
```

**Frontend URL:** http://localhost:5173/

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

> **TODO**: Add demo video URL, live demo URL, screenshots, and presentation PDF before submission.

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- No authentication/authorization (login page is branded landing only)
- SQLite limits concurrent writes; production needs PostgreSQL
- Risk model weights are heuristic, not calibrated on historical failure data
- No real-time WebSocket push — uses 60-second polling
- Weather data is synthetic/seeded; no live weather API integration
- Single-page login — no user session management

---

## 🏅 What We're Most Proud Of

A **fully deterministic, explainable risk engine** that produces auditable Asset Health Scores without black-box ML — critical for regulated utility environments. The engine computes 4 stress dimensions from raw physics telemetry (load, oil temp, voltage, vibration, weather) into a single 0–100 health index with named primary risk factors, enabling operators to trust and act on every recommendation. Zero external API dependencies means judges can run it locally in 2 commands with a pre-seeded 30-day dataset including 3 critical assets (TX-114, TX-107, TX-119).

---

## 🔗 Key API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/assets` | All 20 assets with real-time risk tiers & health scores |
| `GET` | `/api/assets/{id}` | Full telemetry, latest sensor, incidents, maintenance plans |
| `GET` | `/api/assets/{id}/risk` | Real-time predictive failure assessment |
| `GET` | `/api/sensors/{id}/history` | Timeseries sensor readings (voltage, current, oil temp, vibration, PF, load) |
| `GET` | `/api/predictions` | Active risk predictions across all assets |
| `POST` | `/api/predictions/run` | Force grid-wide risk recalculation |
| `GET` | `/api/action-plan/actions` | Prioritized dispatcher actions (Immediate > Urgent > Medium) |
| `GET` | `/api/action-plan/brief` | Executive operator briefing with grid status & crew assignments |
| `GET` | `/api/weather/current` | Current weather for North, South, East, West, Central zones |
| `GET` | `/api/incidents` | Incident logs with severity filtering (Critical, High, Medium, Low) |

---

## 📜 License

This project is submitted for the IBM Bob AI Innovation Hackathon.