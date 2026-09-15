# Source Code

This directory contains all source code for the GridWatch AI application.

## Structure

```
src/
├── backend/           # FastAPI backend
│   ├── app/           # Main application package
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── database.py       # SQLAlchemy database configuration
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── seed_data.py      # Database seeding logic
│   │   ├── routers/          # API route handlers
│   │   │   ├── assets.py
│   │   │   ├── sensors.py
│   │   │   ├── predictions.py
│   │   │   ├── weather.py
│   │   │   ├── incidents.py
│   │   │   └── action_plan.py
│   │   └── services/         # Business logic
│   │       ├── risk_engine.py
│   │       └── brief_generator.py
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Backend environment template
│   └── grid_watch.db          # SQLite database (gitignored)
│
└── frontend/          # React + Vite + TypeScript frontend
    ├── src/
    │   ├── main.tsx              # React entry point
    │   ├── App.tsx               # App with routing
    │   ├── index.css             # Global styles + Tailwind
    │   ├── api/                  # API client & typed endpoints
    │   │   ├── client.ts
    │   │   └── gridApi.ts
    │   ├── types/                # TypeScript interfaces
    │   │   └── grid.ts
    │   ├── components/           # Reusable UI components
    │   │   ├── Layout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── KpiCard.tsx
    │   │   ├── RiskBadge.tsx
    │   │   ├── LoadingState.tsx
    │   │   ├── ErrorState.tsx
    │   │   └── EmptyState.tsx
    │   └── pages/                # Page components
    │       ├── Dashboard.tsx
    │       ├── RiskMap.tsx
    │       ├── Fleet.tsx
    │       ├── AssetDetail.tsx
    │       ├── ActionPlan.tsx
    │       └── Login.tsx
    ├── package.json              # NPM dependencies
    ├── package-lock.json         # Lock file (gitignored)
    ├── vite.config.ts            # Vite configuration
    ├── tsconfig.json             # TypeScript config
    ├── tsconfig.node.json        # TypeScript node config
    ├── tailwind.config.js        # Tailwind CSS config
    ├── postcss.config.js         # PostCSS config
    ├── index.html                # HTML entry point
    ├── .env                      # Local env (gitignored)
    └── .env.example              # Frontend environment template
```

## Running the Backend

```bash
cd src/backend
# Create virtual environment (first time)
python -m venv venv
# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
# Edit .env if needed

# Start server
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Running the Frontend

```bash
cd src/frontend
# Install dependencies (first time)
npm install

# Configure environment
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Start dev server
npm run dev
```

The frontend will be available at http://localhost:5173 and proxies API calls to http://localhost:8000

## Environment Variables

### Backend (`src/backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `GRIDWATCH_DB_PATH` | SQLite database connection string | `sqlite:///./grid_watch.db` |

### Frontend (`src/frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |