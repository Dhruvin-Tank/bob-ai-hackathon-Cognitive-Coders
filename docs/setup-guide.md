# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [ ] **Python 3.11+** — Backend runtime
- [ ] **Node.js 18+** — Frontend build tooling (Vite)
- [ ] **npm 9+** — Frontend package manager
- [ ] **Git** — Version control

## Environment Variables

### Backend (`src/backend/.env`)

Copy `.env.example` to `.env` and fill in the values:

```bash
cd src/backend
cp .env.example .env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `GRIDWATCH_DB_PATH` | SQLite database connection string | No | `sqlite:///./grid_watch.db` |

### Frontend (`src/frontend/.env`)

Copy `.env.example` to `.env`:

```bash
cd src/frontend
cp .env.example .env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | No | `http://localhost:8000` |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dhruvin-Tank/bob-ai-hackathon-Cognitive-Coders.git
cd bob-ai-hackathon-Cognitive-Coders

# 2. Install backend dependencies
cd src/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
pip install -r requirements.txt

# 3. Install frontend dependencies
cd ../frontend
npm install
```

## Running the Application

### Terminal 1 — Backend

```bash
cd src/backend
# Activate venv if not already active
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Start server (auto-seeds database on first run)
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- **API Root**: http://localhost:8000/
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Terminal 2 — Frontend

```bash
cd src/frontend
npm run dev
```

The frontend will be available at:
- **App**: http://localhost:5173/

> The frontend proxies API calls to `http://localhost:8000` via `VITE_API_BASE_URL`.

## Quick Verification

After both servers are running:

1. Open http://localhost:5173/ — you should see the GridWatch login/landing page
2. Click "Enter GridWatch" or navigate to http://localhost:5173/dashboard
3. Verify:
   - KPI cards show: 20 assets, risk counts (Critical/High/Medium/Low)
   - Grid Status badge shows "CRITICAL_ALERT" (TX-114 is critical)
   - Risk Map loads with 20 markers colored by risk tier
   - Fleet page shows tabular asset list with health scores
   - Asset Detail (click any marker) shows telemetry charts
   - Action Plan shows prioritized actions + crew deployments

### API Smoke Tests

```bash
# Health check
curl http://localhost:8000/

# List all assets with risk
curl http://localhost:8000/api/assets | jq

# Get operator brief
curl http://localhost:8000/api/action-plan/brief | jq

# Trigger prediction recalculation
curl -X POST http://localhost:8000/api/predictions/run | jq
```

## Database

The SQLite database (`grid_watch.db`) is automatically created and seeded on first backend startup via the `lifespan` handler in `app/main.py`.

To reset the database:
```bash
cd src/backend
rm grid_watch.db
# Restart uvicorn — it will re-seed automatically
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r requirements.txt` in `src/backend` with venv active |
| `uvicorn: command not found` | Activate virtual environment: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac) |
| `npm: command not found` | Install Node.js 18+ from nodejs.org |
| `npm install` fails with peer dependency errors | Try `npm install --legacy-peer-deps` |
| Frontend shows "Network Error" / blank data | Ensure backend is running on port 8000; check `VITE_API_BASE_URL` in `src/frontend/.env` |
| CORS errors in browser console | Backend allows all origins (`*`) — should not occur; verify backend is on port 8000 |
| Database "already contains assets" message | Normal — seeding only runs on empty database. Delete `grid_watch.db` to force re-seed |
| Port 8000 / 5173 already in use | Stop existing processes: `netstat -ano | findstr :8000` then `taskkill /PID <pid> /F` |

## Running Tests

No automated test suite is included in this hackathon submission. Manual verification via the UI and API endpoints above serves as functional testing.