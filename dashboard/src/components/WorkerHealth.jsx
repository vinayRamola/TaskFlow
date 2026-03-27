import { useEffect, useState } from "react";
import { COLORS } from "../constants";

const STATUS_CONFIG = {
  active:   { color: COLORS.green, dot: "◉", label: "ACTIVE",   pulse: true  },
  idle:     { color: COLORS.blue,  dot: "◎", label: "IDLE",     pulse: false },
  stalled:  { color: COLORS.amber, dot: "◌", label: "STALLED",  pulse: false },
  offline:  { color: COLORS.red,   dot: "⊗", label: "OFFLINE",  pulse: false },
};

export default function WorkerHealth({ t }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWorkers = async () => {
    try {
      const res  = await fetch("http://localhost:3000/workers");
      const data = await res.json();
      setWorkers(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const id = setInterval(fetchWorkers, 5000);
    return () => clearInterval(id);
  }, []);

  const counts = {
    active:  workers.filter(w => w.status === "active").length,
    idle:    workers.filter(w => w.status === "idle").length,
    stalled: workers.filter(w => w.status === "stalled").length,
    offline: workers.filter(w => w.status === "offline").length,
  };

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 8, overflow: "hidden", marginBottom: 12,
    }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes spin   { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 20px", borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: COLORS.green, fontSize: 13 }}>◉</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: t.textSecondary }}>
            WORKER HEALTH
          </span>

          {/* Summary badges */}
          <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
            {Object.entries(counts).filter(([, v]) => v > 0).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <span key={status} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  color: cfg.color, background: `${cfg.color}15`,
                  border: `1px solid ${cfg.color}30`,
                  padding: "2px 7px", borderRadius: 3,
                }}>
                  {count} {cfg.label}
                </span>
              );
            })}
          </div>
        </div>

        <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.08em" }}>
          {loading ? "LOADING…" : `UPDATED ${lastUpdated} · AUTO-REFRESH 5s`}
        </span>
      </div>

      {/* ── Worker Grid ── */}
      {!loading && workers.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: t.textMuted, fontSize: 11, letterSpacing: "0.08em" }}>
          NO WORKERS REGISTERED
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12, padding: 16,
        }}>
          {workers.map(w => <WorkerCard key={w.workerId} worker={w} t={t} />)}
        </div>
      )}
    </div>
  );
}

function WorkerCard({ worker, t }) {
  const [hov, setHov] = useState(false);

  const key    = worker.status?.toLowerCase() ?? "offline";
  const cfg    = STATUS_CONFIG[key] ?? STATUS_CONFIG.offline;

  const uptimeSec  = worker.uptimeMs  ? Math.floor(worker.uptimeMs  / 1000) : null;
  const uptimeStr  = uptimeSec !== null
    ? uptimeSec >= 3600
      ? `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`
      : `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`
    : null;

  const memPercent = worker.memUsageMb && worker.memTotalMb
    ? Math.min(100, Math.round((worker.memUsageMb / worker.memTotalMb) * 100))
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.surfaceAlt,
        border: `1px solid ${hov ? cfg.color + "40" : t.border}`,
        borderRadius: 7, padding: "14px 16px",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? `0 0 20px ${cfg.color}12` : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: cfg.color, opacity: hov ? 1 : 0.4, transition: "opacity 0.2s",
      }} />

      {/* ── Row 1: Worker ID + Status badge ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.1em", marginBottom: 3 }}>WORKER ID</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, letterSpacing: "0.04em" }}>
            {worker.workerId}
          </div>
        </div>

        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: cfg.color,
          border: `1px solid ${cfg.color}30`, background: `${cfg.color}10`,
          padding: "3px 9px", borderRadius: 3,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", background: cfg.color,
            display: "inline-block",
            animation: cfg.pulse ? "pulse 2s ease-in-out infinite" : "none",
          }} />
          {cfg.label}
        </span>
      </div>

      {/* ── Row 2: Stat pills ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <StatPill label="JOBS DONE"    value={worker.jobsProcessed ?? "—"} color={COLORS.green} t={t} />
        <StatPill label="CURRENT JOB"  value={worker.currentJobId ? worker.currentJobId.slice(0, 8) + "…" : "IDLE"} color={COLORS.blue} t={t} />
        {uptimeStr && <StatPill label="UPTIME" value={uptimeStr} color={COLORS.amber} t={t} />}
      </div>

      {/* ── Row 3: Memory bar (optional) ── */}
      {memPercent !== null && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.08em" }}>MEM</span>
            <span style={{ fontSize: 9, color: memPercent > 80 ? COLORS.red : t.textSecondary, fontWeight: 700 }}>
              {worker.memUsageMb}MB / {worker.memTotalMb}MB
            </span>
          </div>
          <div style={{ height: 2, borderRadius: 2, background: t.border, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${memPercent}%`,
              background: memPercent > 80 ? COLORS.red : memPercent > 60 ? COLORS.amber : COLORS.green,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color, t }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 4, padding: "4px 10px",
    }}>
      <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}