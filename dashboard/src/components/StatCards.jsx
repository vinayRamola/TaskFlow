// components/StatCards.jsx
import { useState } from "react";
import { COLORS } from "../constants";

const CARDS = [
  { key: "queued",     label: "QUEUED",     color: COLORS.blue,  sub: "Awaiting workers", symbol: "◌" },
  { key: "processing", label: "PROCESSING", color: COLORS.amber, sub: "Currently running", symbol: "◎" },
  { key: "completed",  label: "COMPLETED",  color: COLORS.green, sub: "Successfully done", symbol: "◉" },
  { key: "failed",     label: "FAILED",     color: COLORS.red,   sub: "Awaiting retry",    symbol: "⊗" },
];

export default function StatCards({ stats, t }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {CARDS.map(card => (
        <Card key={card.key} {...card} value={stats[card.key]} t={t} />
      ))}
    </div>
  );
}

function Card({ label, value, color, sub, symbol, t }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hov ? color + "44" : t.border}`,
        borderRadius: 8, padding: "18px 20px",
        position: "relative", overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? `0 0 24px ${color}14` : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: color, opacity: hov ? 1 : 0.35, transition: "opacity 0.2s",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color }}>{label}</span>
        <span style={{ fontSize: 18, color, opacity: 0.6 }}>{symbol}</span>
      </div>
      <div style={{
        fontSize: 38, fontWeight: 700, color: t.textPrimary,
        letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      <div style={{ fontSize: 10, color: t.textSecondary, letterSpacing: "0.06em" }}>{sub}</div>
    </div>
  );
}