# Industrial Predictive Maintenance & Smart Factory Dashboard

A full-stack portfolio project that simulates a small factory, monitors electrical-machine condition, flags abnormal sensor patterns with an Isolation Forest model, and summarizes maintenance KPIs.

> **Demo-data notice:** All assets, readings, alerts, and maintenance records are synthetic. This project is an educational prototype, not a certified safety, protection, or maintenance system. Never use its predictions to make real equipment-safety decisions.

## Features

- React + Vite dashboard with equipment status, sensor trends, alerts, and maintenance history.
- FastAPI backend with REST endpoints and generated motor/pump/compressor telemetry.
- Scikit-learn Isolation Forest anomaly detection using temperature, vibration, current, and voltage.
- Equipment-level health indicators and explainable rule-based alert reasons.
- OEE, MTTR, and MTBF demonstration metrics.
- Maintenance work-order creation and status tracking.

## Architecture

```text
industrial-predictive-maintenance/
  backend/
    app/main.py
    requirements.txt
  frontend/
    src/main.jsx
    src/style.css
    index.html
    package.json
```

## Run on Windows

### 1. Backend

Open CMD in the `backend` folder:

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://localhost:8000  
Interactive API docs: http://localhost:8000/docs

### 2. Frontend

Open a **second** CMD in the `frontend` folder:

```cmd
npm install
npm run dev
```

Dashboard: http://localhost:5173

Keep both CMD windows running. The frontend calls the backend at http://localhost:8000.

## API

- `GET /api/health` — service status
- `GET /api/dashboard` — KPI summary and asset overview
- `GET /api/assets` — list monitored assets
- `GET /api/assets/{asset_id}/readings` — recent sensor history
- `GET /api/alerts` — latest anomaly alerts
- `GET /api/maintenance` — maintenance work orders
- `POST /api/maintenance` — create a work order

## ML approach

The backend generates reproducible demo telemetry and fits an Isolation Forest on a rolling set of readings for each asset. The model flags unusual combinations of temperature, vibration, current, and voltage. Rule-based checks add human-readable context to alerts. The model is trained on synthetic data, so its output demonstrates a workflow and is not validated against real plant failure data.

## KPI definitions

- **OEE** = Availability × Performance × Quality.
- **MTTR** = Total repair time / Number of repairs.
- **MTBF** = Operating time / Number of failures.

The dashboard uses illustrative values for these KPIs.

## Next improvements

Connect a real sensor/PLC gateway with authorization, persist telemetry in PostgreSQL or TimescaleDB, add user authentication and audit logs, validate models against labeled failure data, and implement role-based maintenance workflows.
