import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

const chartColors = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

const dark = {
  bg: "#070d1a",
  surface: "#0d1526",
  surfaceAlt: "#111c33",
  border: "#1a2844",
  borderHover: "#2a3f6a",
  textPrimary: "#e2eafc",
  textSecondary: "#5a7aad",
  textMuted: "#2d4470",
  gridStroke: "#141f36",
  toggleBg: "#111c33",
  footerText: "#2d4470",
};

const light = {
  bg: "#eef2fb",
  surface: "#ffffff",
  surfaceAlt: "#f4f7ff",
  border: "#dce6f7",
  borderHover: "#b3c9f0",
  textPrimary: "#0d1a3a",
  textSecondary: "#4a6490",
  textMuted: "#a0b4d4",
  gridStroke: "#e8eef8",
  toggleBg: "#e4ecfa",
  footerText: "#a0b4d4",
};

export default function App() {
  const [theme, setTheme] = useState("dark");
  const t = theme === "dark" ? dark : light;

  const [stats, setStats] = useState({ queued: 0, processing: 0, completed: 0, failed: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3000/stats");
        const data = await res.json();
        setStats(data);
        setHistory(prev => [
          ...prev.slice(-20),
          {
            time: new Date().toLocaleTimeString(),
            queued: data.queued,
            completed: data.completed,
            failed: data.failed,
          },
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const successRate =
    stats.completed + stats.failed > 0
      ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.textPrimary, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: "background 0.25s, color 0.25s" }}>

      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 60, background: t.surface, borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 50 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="#3b82f6"/>
            <path d="M6 13h5l2-5 3 10 2-5h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 17 }}>
  Task<span style={{ color: "#3b82f6" }}>Flow</span>
</span>

<span style={{ color: t.textSecondary, fontSize: 13 }}>
  Distributed Queue Monitoring
</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textSecondary, background: t.surfaceAlt, border: `1px solid ${t.border}`, padding: "2px 8px", borderRadius: 20 }}>Dashboard</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => setTheme(th => th === "dark" ? "light" : "dark")}
            style={{ background: t.toggleBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "5px 14px", cursor: "pointer", color: t.textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {[["GitHub", "https://github.com/vinayRamola"], ["LinkedIn", "https://www.linkedin.com/in/vinay-chand-ramola-970061223/"]].map(([name, href]) => (
              <a key={name} href={href} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: t.textSecondary, textDecoration: "none", padding: "5px 12px", borderRadius: 7, border: `1px solid ${t.border}` }}
              >{name}</a>
            ))}
          </div>
        </div>

      </header>

      {/* BODY */}
      <div style={{ padding: "16px 24px", maxWidth: 1400, margin: "0 auto" }}>

       

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
          <Card label="Queued"     value={stats.queued}      color="#3b82f6" sub="Awaiting workers"   icon="⏳" t={t} />
          <Card label="Processing" value={stats.processing}  color="#f59e0b" sub="Currently running"  icon="⚙" t={t} />
          <Card label="Completed"  value={stats.completed}   color="#10b981" sub="Successfully done"  icon="✓" t={t} />
          <Card label="Failed"     value={stats.failed}      color="#ef4444" sub="With retry logic"   icon="✕" t={t} />
        </div>

        {/* QUEUE DEPTH PANEL */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 18 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textSecondary, marginBottom: 14 }}>Queue Depth</h3>
          <div style={{ display: "flex", gap: 40 }}>
            {[["Queued", stats.queued, "#3b82f6"], ["Processing", stats.processing, "#f59e0b"], ["Completed", stats.completed, "#10b981"], ["Failed", stats.failed, "#ef4444"]].map(([label, val, color]) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4, fontFamily: "monospace", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Success Rate" value={`${successRate}%`} color="#10b981" t={t} />
          <Metric label="Workers"      value="4 Active"           color="#3b82f6" t={t} />
          <Metric label="Auto Refresh" value="5 sec"              color="#f59e0b" t={t} />
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 20 }}>

          <ChartCard title="Queue Depth Over Time" sub="Last 20 data points · 5s interval" t={t}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={history}>
                <defs>
                  {["queued", "completed", "failed"].map((k, i) => (
                    <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColors[[0,2,3][i]]} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={chartColors[[0,2,3][i]]} stopOpacity={0.02}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={t.gridStroke} vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: t.textMuted, fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: t.textMuted, fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12, color: t.textPrimary }}/>
                <Legend wrapperStyle={{ fontSize: 11, color: t.textSecondary }}/>
                <Area type="monotone" dataKey="queued"    stroke={chartColors[0]} fill="url(#g_queued)"    strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="completed" stroke={chartColors[2]} fill="url(#g_completed)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="failed"    stroke={chartColors[3]} fill="url(#g_failed)"    strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Job Status Breakdown" sub="Current snapshot" t={t}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: "Queued",     value: stats.queued },
                { name: "Processing", value: stats.processing },
                { name: "Completed",  value: stats.completed },
                { name: "Failed",     value: stats.failed },
              ]}>
                <CartesianGrid stroke={t.gridStroke} vertical={false}/>
                <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: t.textMuted, fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12, color: t.textPrimary }}/>
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

       

        {/* FOOTER */}
        <footer style={{ marginTop: 14, borderTop: `1px solid ${t.border}`, paddingTop: 18, textAlign: "center", fontSize: 12, color: t.footerText }}>
          Built by <span style={{ color: "#3b82f6", fontWeight: 600 }}>Vinay Chand Ramola</span> &nbsp;·&nbsp; TaskFlow
        </footer>

      </div>
    </div>
  );
}


/* ── Components ── */

function Card({ label, value, color, sub, icon, t }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? t.surfaceAlt : t.surface,
        border: `1px solid ${hover ? color + "55" : t.border}`,
        borderRadius: 12, padding: "14px 16px",
        transition: "all 0.2s", cursor: "default",
        boxShadow: hover ? `0 4px 20px ${color}18` : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 64, height: 64, borderRadius: "0 14px 0 64px", background: color + "18", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "10px 12px", fontSize: 16 }}>{icon}</div>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color, marginBottom: 8 }}>{label}</p>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, fontFamily: "monospace", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>{value}</h2>
      <p style={{ fontSize: 11, color: t.textSecondary }}>{sub}</p>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: color + "60", transform: hover ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s ease" }}/>
    </div>
  );
}

function Metric({ label, value, color, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: t.textSecondary }}>{label}</span>
      <b style={{ fontSize: 16, fontFamily: "monospace", color, fontWeight: 700 }}>{value}</b>
    </div>
  );
}

function ChartCard({ title, sub, children, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "22px 22px 10px" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: t.textSecondary, fontFamily: "monospace", marginBottom: 14 }}>{sub}</p>
      {children}
    </div>
  );
}