// App.jsx
import { useEffect, useState } from "react";
import { COLORS, THEME } from "./constants";
import StatCards from "./components/StatCards";
import QueueMetrics from "./components/QueueMetrics";
import Charts from "./components/Charts";
import JobHistory from "./components/JobHistory";
import DeadLetterPanel from "./components/DeadLetterPanel";

export default function App() {
  const [mode, setMode] = useState("dark");
  const t = THEME[mode];

  const [stats, setStats] = useState({ queued: 0, processing: 0, completed: 0, failed: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const tick = async () => {
      try {
        const res  = await fetch("http://localhost:3000/stats");
        const data = await res.json();
        setStats(data);
        setHistory(prev => [
          ...prev.slice(-20),
          { time: new Date().toLocaleTimeString(), ...data },
        ]);
      } catch (e) {
        console.error(e);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  const successRate =
    stats.completed + stats.failed > 0
      ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1)
      : "—";

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bg,
      color: t.textPrimary,
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      transition: "background 0.3s, color 0.3s",
    }}>

      {/* HEADER */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 40px", height: 56,
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", color: t.textPrimary }}>
            TASK<span style={{ color: COLORS.blue }}>FLOW</span>
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
            color: t.textSecondary, background: t.badge,
            border: `1px solid ${t.border}`, padding: "2px 9px", borderRadius: 3,
          }}>QUEUE MONITOR</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PulseIndicator />
          <button
            onClick={() => setMode(m => m === "dark" ? "light" : "dark")}
            style={{
              background: "none", border: `1px solid ${t.border}`,
              borderRadius: 4, padding: "4px 12px", cursor: "pointer",
              color: t.textSecondary, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.08em", fontFamily: "inherit",
            }}
          >{mode === "dark" ? "LIGHT" : "DARK"}</button>
          {[["GH", "https://github.com/vinayRamola"], ["LI", "https://www.linkedin.com/in/vinay-chand-ramola-970061223/"]].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: t.textSecondary, textDecoration: "none",
              padding: "4px 11px", border: `1px solid ${t.border}`,
              borderRadius: 4, letterSpacing: "0.08em", fontWeight: 600,
            }}>{label}</a>
          ))}
        </div>
      </header>

      {/* BODY */}
      <main style={{ padding: "24px 40px 40px", maxWidth: 1380, margin: "0 auto" }}>
        <StatCards stats={stats} t={t} />
        <QueueMetrics stats={stats} successRate={successRate} t={t} />
        <Charts stats={stats} history={history} t={t} />
        <JobHistory t={t} />
        <DeadLetterPanel t={t} />

        <footer style={{
          marginTop: 32, borderTop: `1px solid ${t.border}`, paddingTop: 16,
          textAlign: "center", fontSize: 11, color: t.footerText, letterSpacing: "0.08em",
        }}>
          BUILT BY <span style={{ color: COLORS.blue, fontWeight: 700 }}>VINAY CHAND RAMOLA</span> · TASKFLOW
        </footer>
      </main>
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="5" fill={COLORS.blue} fillOpacity="0.15" />
      <rect width="22" height="22" rx="5" stroke={COLORS.blue} strokeWidth="1" />
      <path d="M4 11h4l2-4 2.5 8L15 11h3" stroke={COLORS.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PulseIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", border: `1px solid ${COLORS.green}20`, borderRadius: 4 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: COLORS.green,
        boxShadow: `0 0 8px ${COLORS.green}`, display: "inline-block",
        animation: "pulse 2s ease-in-out infinite",
      }} />
      <span style={{ fontSize: 10, color: COLORS.green, letterSpacing: "0.1em", fontWeight: 700 }}>LIVE</span>
    </div>
  );
}