// components/Charts.jsx
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from "recharts";
import { COLORS } from "../constants";

const AREA_KEYS   = ["queued", "completed", "failed"];
const AREA_COLORS = [COLORS.blue, COLORS.green, COLORS.red];

export default function Charts({ stats, history, t }) {
  const barData = [
    { name: "QUEUED",     value: stats.queued },
    { name: "PROCESSING", value: stats.processing },
    { name: "COMPLETED",  value: stats.completed },
    { name: "FAILED",     value: stats.failed },
  ];

  const tooltip = {
    contentStyle: {
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 6, fontSize: 11, color: t.textPrimary, fontFamily: "inherit",
    },
    labelStyle: { color: t.textSecondary },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12, marginBottom: 20 }}>

      <Panel title="QUEUE DEPTH OVER TIME" sub={`Last ${history.length} snapshots · 5s interval`} t={t}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={history}>
            <defs>
              {AREA_KEYS.map((k, i) => (
                <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AREA_COLORS[i]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={AREA_COLORS[i]} stopOpacity={0}   />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={t.gridStroke} vertical={false} />
            <XAxis dataKey="time" tick={{ fill: t.textMuted, fontSize: 9, fontFamily: "inherit" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: t.textMuted, fontSize: 9, fontFamily: "inherit" }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} />
            <Legend wrapperStyle={{ fontSize: 10, color: t.textSecondary, fontFamily: "inherit" }} />
            {AREA_KEYS.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k}
                stroke={AREA_COLORS[i]} fill={`url(#g_${k})`}
                strokeWidth={1.5} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="JOB STATUS BREAKDOWN" sub="Current snapshot" t={t}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barSize={28}>
            <CartesianGrid stroke={t.gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 9, fontFamily: "inherit" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: t.textMuted, fontSize: 9, fontFamily: "inherit" }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} />
            <Bar dataKey="value" fill={COLORS.blue} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

    </div>
  );
}

function Panel({ title, sub, children, t }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 8, padding: "18px 18px 8px",
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: t.textSecondary, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.06em" }}>{sub}</div>
      </div>
      {children}
    </div>
  );
}