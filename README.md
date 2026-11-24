# ForgeWatch — Industrial Intelligence Platform

**A smart-factory monitoring and predictive-maintenance portfolio project.**

ForgeWatch brings equipment condition monitoring, anomaly detection, maintenance planning, and reliability KPIs into one industrial-style dashboard. It simulates a small plant with motors, pumps, and compressors so the complete workflow can be explored without connecting to real equipment.

> **Demo-data notice:** All assets, readings, alerts, and maintenance records are synthetic. This is an educational prototype, not a certified safety, protection, or maintenance system. Never use its predictions to make real equipment-safety decisions.

## What makes ForgeWatch useful

- **Equipment intelligence:** Monitor motor, pump, and compressor condition from a single asset register.
- **Sensor analytics:** Explore temperature, vibration, current, and voltage trends.
- **ML anomaly detection:** Demonstrate an Isolation Forest workflow for identifying unusual sensor patterns.
- **Maintenance workflow:** Create and track maintenance work orders with priority levels.
- **Reliability dashboard:** Review OEE, MTTR, MTBF, asset health, alerts, and PM compliance.
- **Full-stack architecture:** React + Vite frontend, FastAPI backend, and Python / Scikit-learn analytics.

## Technology stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Recharts |
| Backend | Python, FastAPI |
| Machine learning | Scikit-learn, Isolation Forest |
| Data | Synthetic equipment telemetry |

## Project structure

```text
ForgeWatch/
├── backend/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   └── style.css
    ├── index.html
    └── package.json
```

## Run locally on Windows

### 1. Start the backend

Open Command Prompt in the `backend` folder:

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs

### 2. Start the frontend

Open a **second** Command Prompt in the `frontend` folder:

```cmd
npm install
npm run dev
```

- Dashboard: http://localhost:5173

Keep both terminal windows open while using the dashboard.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/dashboard` | KPI summary and asset overview |
| GET | `/api/assets` | Monitored equipment list |
| GET | `/api/assets/{asset_id}/readings` | Sensor history for an asset |
| GET | `/api/alerts` | Latest anomaly alerts |
| GET | `/api/maintenance` | Maintenance work orders |
| POST | `/api/maintenance` | Create a work order |

## How the anomaly demo works

The backend generates repeatable demo telemetry and applies a Scikit-learn Isolation Forest to sensor readings. Unusual combinations of temperature, vibration, current, and voltage can be flagged, with additional rule-based text to make alerts easier to interpret.

The model uses synthetic data; its output is not validated against real plant failure records and should not be treated as a real predictive-maintenance model.

## Reliability KPI notes

- **OEE** = Availability × Performance × Quality
- **MTTR** = Total repair time ÷ Number of repairs
- **MTBF** = Operating time ÷ Number of failures

Values shown in the dashboard are illustrative.

## Roadmap

- Connect a properly secured PLC / sensor gateway.
- Store time-series telemetry in PostgreSQL or TimescaleDB.
- Add authentication, role-based access, and audit logs.
- Validate models using labelled industrial failure datasets.
- Add maintenance scheduling and technician assignment.

---

**ForgeWatch | Industrial Intelligence**  
*Monitor smarter. Maintain proactively. Reduce avoidable downtime.*
