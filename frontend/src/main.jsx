import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import "./style.css";

const API = "http://localhost:8000";
const number = (value, digits = 1) => Number(value ?? 0).toFixed(digits);

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [selected, setSelected] = useState("MTR-101");
  const [readings, setReadings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ asset_id: "MTR-101", title: "", priority: "Medium", description: "" });

  async function loadDashboard() {
    try {
      const [dash, work] = await Promise.all([
        fetch(`${API}/api/dashboard`).then(r => { if (!r.ok) throw new Error("Backend API is not responding"); return r.json(); }),
        fetch(`${API}/api/maintenance`).then(r => r.json())
      ]);
      setDashboard(dash);
      setOrders(work);
      setError("");
    } catch (e) {
      setError(e.message + ". Start the FastAPI backend on port 8000.");
    }
  }

  async function loadReadings(assetId) {
    try {
      const rows = await fetch(`${API}/api/assets/${assetId}/readings?limit=48`).then(r => r.json());
      setReadings(rows.map(row => ({
        ...row,
        time: new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    } catch {
      setReadings([]);
    }
  }

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadReadings(selected); }, [selected]);

  const asset = useMemo(() => dashboard?.assets?.find(item => item.id === selected), [dashboard, selected]);

  async function submitWorkOrder(event) {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/api/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error("Could not create work order");
      setForm({ asset_id: selected, title: "", priority: "Medium", description: "" });
      setShowForm(false);
      await loadDashboard();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !dashboard) return <main className="center"><div className="error-card"><h2>ForgeWatch is waiting for the backend</h2><p>{error}</p><button onClick={loadDashboard}>Retry connection</button></div></main>;

  const k = dashboard?.kpis;
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">F</div><div><strong>FORGEWATCH</strong><span>INDUSTRIAL INTELLIGENCE</span></div></div>
        <div className="top-meta"><span className="live-dot"></span> DEMO SYSTEM ONLINE <span className="divider">|</span> Silchar Plant <span className="avatar">SR</span></div>
      </header>

      <section className="welcome">
        <div><div className="eyebrow">OPERATIONS / OVERVIEW</div><h1>Predictive Maintenance</h1><p>Monitor equipment health, identify abnormal behaviour and plan maintenance before downtime.</p></div>
        <div className="demo-tag">● SYNTHETIC DEMO DATA</div>
      </section>

      {error && <div className="inline-error">{error}</div>}

      <section className="kpi-grid">
        <Kpi label="ASSETS MONITORED" value={k?.assets_monitored ?? "—"} suffix="units" tone="blue" foot="Across 3 operating areas"/>
        <Kpi label="ACTIVE ALERTS" value={k?.active_alerts ?? "—"} suffix="alerts" tone="orange" foot="ML + threshold indicators"/>
        <Kpi label="OVERALL EQUIPMENT EFFECTIVENESS" value={number(k?.oee)} suffix="%" tone="green" foot="Availability × Performance × Quality"/>
        <Kpi label="PM COMPLIANCE" value={number(k?.pm_compliance)} suffix="%" tone="purple" foot="Illustrative monthly KPI"/>
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-head"><div><div className="eyebrow">PERFORMANCE</div><h2>Plant efficiency trend</h2></div><span className="legend"><i></i> OEE <i className="legend-blue"></i> Availability</span></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard?.trend ?? []}><defs><linearGradient id="oeeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c58b" stopOpacity={0.22}/><stop offset="100%" stopColor="#22c58b" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#24313e" vertical={false}/><XAxis dataKey="period" stroke="#788797" tickLine={false} axisLine={false}/><YAxis domain={[75, 100]} stroke="#788797" tickLine={false} axisLine={false}/><Tooltip contentStyle={{background:"#17232e",border:"1px solid #30404e",borderRadius:10}}/><Area type="monotone" dataKey="oee" stroke="#22c58b" fill="url(#oeeFill)" strokeWidth={2.5}/><Line type="monotone" dataKey="availability" stroke="#5ba9ff" strokeWidth={2} dot={false}/></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="panel health-panel">
          <div className="panel-head"><div><div className="eyebrow">RELIABILITY</div><h2>Maintenance indicators</h2></div><span className="muted">MTD</span></div>
          <Metric label="Mean time to repair" value={number(k?.mttr_hours)} unit="hrs" detail="Average repair duration"/>
          <Metric label="Mean time between failures" value={number(k?.mtbf_hours,0)} unit="hrs" detail="Average operating interval"/>
          <Metric label="Healthy assets" value={k?.healthy_assets ?? "—"} unit={`/ ${k?.assets_monitored ?? "—"}`} detail="No current active alert"/>
        </div>
      </section>

      <section className="content-grid lower">
        <div className="panel wide">
          <div className="panel-head"><div><div className="eyebrow">EQUIPMENT REGISTER</div><h2>Asset health overview</h2></div><span className="muted">Select an asset to inspect</span></div>
          <div className="table-wrap"><table><thead><tr><th>ASSET</th><th>AREA</th><th>TEMP.</th><th>VIBRATION</th><th>CURRENT</th><th>HEALTH</th><th>STATUS</th></tr></thead><tbody>
            {(dashboard?.assets ?? []).map(item => <tr key={item.id} className={selected === item.id ? "selected" : ""} onClick={() => setSelected(item.id)}><td><strong>{item.name}</strong><small>{item.id} · {item.type}</small></td><td>{item.area}</td><td>{number(item.temperature)} °C</td><td>{number(item.vibration,2)} mm/s</td><td>{number(item.current)} A</td><td><div className="health-cell"><b>{item.health_score}</b><span><i style={{width: item.health_score + "%"}}></i></span></div></td><td><Status status={item.status}/></td></tr>)}
          </tbody></table></div>
        </div>
        <div className="panel alerts-panel">
          <div className="panel-head"><div><div className="eyebrow">EARLY WARNING</div><h2>Recent alerts</h2></div><span className="count">{dashboard?.alerts?.length ?? 0}</span></div>
          {(dashboard?.alerts ?? []).length ? dashboard.alerts.map(alert => <div className="alert-item" key={alert.id}><div className="alert-icon">!</div><div><div className="alert-title">{alert.asset_id}<Status status={alert.severity}/></div><p>{alert.message}</p><small>{number(alert.temperature)} °C · {number(alert.vibration,2)} mm/s</small></div></div>) : <p className="muted">No active alerts.</p>}
        </div>
      </section>

      <section className="content-grid bottom">
        <div className="panel wide">
          <div className="panel-head"><div><div className="eyebrow">SENSOR ANALYTICS</div><h2>{asset?.name ?? "Asset"} · condition history</h2></div><select value={selected} onChange={e => setSelected(e.target.value)}>{(dashboard?.assets ?? []).map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</select></div>
          <div className="sensor-legend"><span>Temperature (°C)</span><span>Vibration (mm/s)</span><span>ML anomaly markers included in readings</span></div>
          <div className="chart sensor-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={readings}><CartesianGrid stroke="#24313e" vertical={false}/><XAxis dataKey="time" stroke="#788797" tickLine={false} axisLine={false} minTickGap={28}/><YAxis yAxisId="left" stroke="#f3a64a" tickLine={false} axisLine={false}/><YAxis yAxisId="right" orientation="right" stroke="#5ba9ff" tickLine={false} axisLine={false}/><Tooltip contentStyle={{background:"#17232e",border:"1px solid #30404e",borderRadius:10}}/><Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f3a64a" dot={false} strokeWidth={2}/><Line yAxisId="right" type="monotone" dataKey="vibration" stroke="#5ba9ff" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>
        </div>
        <div className="panel work-panel">
          <div className="panel-head"><div><div className="eyebrow">MAINTENANCE PLANNING</div><h2>Work orders</h2></div><button className="small-button" onClick={() => {setForm({...form, asset_id:selected});setShowForm(!showForm);}}>+ New</button></div>
          {showForm && <form className="work-form" onSubmit={submitWorkOrder}><input required minLength="4" placeholder="Work order title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select value={form.asset_id} onChange={e=>setForm({...form,asset_id:e.target.value})}>{(dashboard?.assets ?? []).map(a=><option key={a.id} value={a.id}>{a.id}</option>)}</select><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea placeholder="Work details (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button type="submit">Create work order</button></form>}
          <div className="orders">{orders.map(order=><div className="order" key={order.id}><div className="order-top"><b>{order.id}</b><Status status={order.priority}/></div><strong>{order.title}</strong><small>{order.asset_id} · {order.status}</small></div>)}</div>
        </div>
      </section>
      <footer>FORGEWATCH · EDUCATIONAL PROTOTYPE <span>Model: Isolation Forest · Data: Synthetic simulation · Not for safety-critical use</span></footer>
    </main>
  );
}

function Kpi({label,value,suffix,tone,foot}) { return <div className={`kpi ${tone}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}<small>{suffix}</small></div><div className="kpi-foot">{foot}</div></div>; }
function Metric({label,value,unit,detail}) { return <div className="metric"><div><span>{label}</span><small>{detail}</small></div><strong>{value}<small>{unit}</small></strong></div>; }
function Status({status}) { const key=String(status).toLowerCase().replaceAll(" ","-"); return <span className={`status ${key}`}>{status}</span>; }

createRoot(document.getElementById("root")).render(<App />);
