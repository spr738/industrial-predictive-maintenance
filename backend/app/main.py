from datetime import datetime, timedelta, timezone
from typing import Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest

app = FastAPI(
    title="Smart Factory Predictive Maintenance API",
    version="1.0.0",
    description="Synthetic industrial telemetry and educational anomaly detection demo.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ASSETS = [
    {"id": "MTR-101", "name": "Packaging Line Motor 1", "type": "Induction Motor", "area": "Packaging Line A", "criticality": "High"},
    {"id": "MTR-102", "name": "Conveyor Motor 2", "type": "Induction Motor", "area": "Packaging Line A", "criticality": "Medium"},
    {"id": "PMP-201", "name": "Cooling Water Pump", "type": "Centrifugal Pump", "area": "Utilities", "criticality": "High"},
    {"id": "CMP-301", "name": "Air Compressor", "type": "Compressor", "area": "Utilities", "criticality": "High"},
    {"id": "MTR-103", "name": "Filling Machine Motor", "type": "Induction Motor", "area": "Packaging Line B", "criticality": "Medium"},
]

_rng = np.random.default_rng(42)
_NOW = datetime.now(timezone.utc)
_TELEMETRY = {}
_ALERTS = []
_WORK_ORDERS = [
    {"id": "WO-1001", "asset_id": "MTR-102", "title": "Inspect conveyor motor coupling", "priority": "Medium", "status": "In progress", "created_at": (_NOW - timedelta(hours=5)).isoformat()},
    {"id": "WO-1002", "asset_id": "PMP-201", "title": "Lubrication and bearing inspection", "priority": "Low", "status": "Open", "created_at": (_NOW - timedelta(days=1)).isoformat()},
]

def build_telemetry():
    global _TELEMETRY, _ALERTS
    _TELEMETRY = {}
    _ALERTS = []
    for index, asset in enumerate(ASSETS):
        count = 96
        timestamps = [_NOW - timedelta(minutes=15 * (count - i - 1)) for i in range(count)]
        temp = _rng.normal(64 + index * 1.5, 3.0, count)
        vibration = _rng.normal(2.1 + index * 0.12, 0.35, count)
        current = _rng.normal(12 + index * 0.8, 0.9, count)
        voltage = _rng.normal(415, 4, count)
        # Add a short, intentionally abnormal tail to demonstrate anomaly detection.
        if index in (0, 3):
            temp[-5:] += np.linspace(5, 15, 5)
            vibration[-5:] += np.linspace(1.0, 3.0, 5)
        if index == 2:
            current[-3:] += np.array([2.5, 3.5, 4.5])
        frame = pd.DataFrame({
            "timestamp": timestamps,
            "temperature": np.round(temp, 2),
            "vibration": np.round(vibration, 2),
            "current": np.round(current, 2),
            "voltage": np.round(voltage, 2),
        })
        model = IsolationForest(contamination=0.06, random_state=42)
        features = frame[["temperature", "vibration", "current", "voltage"]]
        frame["anomaly"] = model.fit_predict(features) == -1
        frame["anomaly_score"] = np.round(-model.score_samples(features), 4)
        _TELEMETRY[asset["id"]] = frame
        last = frame.iloc[-1]
        reasons = []
        if last.temperature > 78:
            reasons.append("Motor temperature is above the demo threshold")
        if last.vibration > 4.0:
            reasons.append("Vibration is above the demo threshold")
        if last.current > 16.5:
            reasons.append("Current draw is above the demo threshold")
        if bool(last.anomaly) or reasons:
            _ALERTS.append({
                "id": f"ALT-{index + 1:03d}",
                "asset_id": asset["id"],
                "asset_name": asset["name"],
                "severity": "High" if len(reasons) > 1 or last.temperature > 82 else "Medium",
                "message": "; ".join(reasons) if reasons else "ML model detected an unusual sensor pattern",
                "temperature": float(last.temperature),
                "vibration": float(last.vibration),
                "current": float(last.current),
                "timestamp": timestamps[-1].isoformat(),
                "model_flag": bool(last.anomaly),
            })

build_telemetry()

class WorkOrderIn(BaseModel):
    asset_id: str
    title: str = Field(min_length=4, max_length=140)
    priority: str = Field(pattern="^(Low|Medium|High|Critical)$")
    description: Optional[str] = Field(default="", max_length=500)

def asset_summary(asset):
    frame = _TELEMETRY[asset["id"]]
    last = frame.iloc[-1]
    recent_alert = any(a["asset_id"] == asset["id"] for a in _ALERTS)
    status = "Attention" if recent_alert else "Healthy"
    return {
        **asset,
        "status": status,
        "temperature": float(last.temperature),
        "vibration": float(last.vibration),
        "current": float(last.current),
        "voltage": float(last.voltage),
        "anomaly": bool(last.anomaly),
        "health_score": max(55, min(99, int(98 - last.anomaly_score * 24 - (8 if recent_alert else 0)))),
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Smart Factory Predictive Maintenance API", "demo_data": True}

@app.get("/api/dashboard")
def dashboard():
    summaries = [asset_summary(asset) for asset in ASSETS]
    healthy = sum(item["status"] == "Healthy" for item in summaries)
    return {
        "kpis": {
            "assets_monitored": len(ASSETS),
            "healthy_assets": healthy,
            "active_alerts": len(_ALERTS),
            "oee": 86.4,
            "mttr_hours": 2.3,
            "mtbf_hours": 186.0,
            "pm_compliance": 94.2,
        },
        "assets": summaries,
        "alerts": _ALERTS[:5],
        "trend": [
            {"period": f"{i:02d}:00", "availability": round(94 + np.sin(i / 2) * 2.2, 1), "oee": round(84 + np.cos(i / 3) * 3.0, 1)}
            for i in range(8, 20, 2)
        ],
        "demo_data": True,
    }

@app.get("/api/assets")
def list_assets():
    return [asset_summary(asset) for asset in ASSETS]

@app.get("/api/assets/{asset_id}/readings")
def readings(asset_id: str, limit: int = 48):
    if asset_id not in _TELEMETRY:
        raise HTTPException(status_code=404, detail="Asset not found")
    frame = _TELEMETRY[asset_id].tail(max(1, min(limit, 96))).copy()
    frame["timestamp"] = frame["timestamp"].map(lambda value: value.isoformat())
    return frame.to_dict(orient="records")

@app.get("/api/alerts")
def alerts():
    return _ALERTS

@app.get("/api/maintenance")
def maintenance():
    return sorted(_WORK_ORDERS, key=lambda item: item["created_at"], reverse=True)

@app.post("/api/maintenance")
def create_work_order(payload: WorkOrderIn):
    if payload.asset_id not in _TELEMETRY:
        raise HTTPException(status_code=404, detail="Asset not found")
    order = {
        "id": f"WO-{1000 + len(_WORK_ORDERS) + 1}",
        "asset_id": payload.asset_id,
        "title": payload.title,
        "priority": payload.priority,
        "status": "Open",
        "description": payload.description or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _WORK_ORDERS.append(order)
    return order
