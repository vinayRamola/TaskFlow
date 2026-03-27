// components/QueueMetrics.jsx
import { COLORS } from "../constants";

const ITEMS = [
  { key: "queued",     label: "QUEUED",     color: COLORS.blue  },
  { key: "processing", label: "PROCESSING", color: COLORS.amber },
  { key: "completed",  label: "COMPLETED",  color: COLORS.green },
  { key: "failed",     label: "FAILED",     color: COLORS.red   },
];

export default function QueueMetrics({ stats, successRate, t }) {
  const total = ITEMS.reduce((s, { key }) => s + stats[key], 0) || 1;

  const metrics = [
    { label: "SUCCESS RATE", value: `${successRate}%`, color: COLORS.green },
    { label: "WORKERS",      value: "4 ACTIVE",         color: COLORS.blue  },
    { label: "REFRESH",      value: "5s",               color: COLORS.amber },
  ];

  return (
    <>
      {/* Queue depth bar */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 8, padding: "14px 20px", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: t.textSecondary, marginRight: 32, minWidth: 90 }}>
          QUEUE DEPTH
        </span>

        {/* Proportional stacked bar */}
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.border, display: "flex", overflow: "hidden", marginRight: 32 }}>
          {ITEMS.map(({ key, color }) => (
            <div key={key} style={{
              width: `${(stats[key] / total) * 100}%`,
              background: color,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {ITEMS.map(({ key, label, color }) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: t.textSecondary, letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{stats[key]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {metrics.map(({ label, value, color }) => (
          <div key={label} style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: "10px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 10, color: t.textSecondary, letterSpacing: "0.1em", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}