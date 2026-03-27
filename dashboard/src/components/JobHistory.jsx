// components/JobHistory.jsx
import { useEffect, useState } from "react";
import { COLORS } from "../constants";

const STATUS_CONFIG = {
  completed:  { color: COLORS.green, dot: "◉", label: "COMPLETED"  },
  processing: { color: COLORS.amber, dot: "◎", label: "PROCESSING" },
  queued:     { color: COLORS.blue,  dot: "◌", label: "QUEUED"     },
  failed:     { color: COLORS.red,   dot: "⊗", label: "FAILED"     },
};

const COLS = [
  { key: "jobId",      label: "JOB ID",   width: "22%" },
  { key: "type",       label: "TYPE",     width: "18%" },
  { key: "status",     label: "STATUS",   width: "18%" },
  { key: "workerId",   label: "WORKER",   width: "16%" },
  { key: "retryCount", label: "RETRIES",  width: "10%" },
  { key: "latencyMs",  label: "LATENCY",  width: "16%" },
];

export default function JobHistory({ t }) {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch("http://localhost:3000/jobs?limit=20");
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 8, overflow: "hidden", marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 20px", borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: t.textSecondary }}>
          JOB HISTORY
        </span>
        <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.08em" }}>
          {loading ? "LOADING…" : `${jobs.length} RECORDS · AUTO-REFRESH 5s`}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {COLS.map(col => (
                <th key={col.key} style={{
                  width: col.width, padding: "8px 20px", textAlign: "left",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  color: t.textMuted, whiteSpace: "nowrap",
                }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 20px", textAlign: "center", color: t.textMuted, fontSize: 11, letterSpacing: "0.08em" }}>
                  NO JOBS FOUND
                </td>
              </tr>
            ) : (
              jobs.map(job => <JobRow key={job.jobId} job={job} t={t} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobRow({ job, t }) {
  const [hov, setHov] = useState(false);
  const key    = job.status?.toLowerCase();
  const status = STATUS_CONFIG[key] ?? { color: t.textSecondary, dot: "·", label: job.status ?? "UNKNOWN" };

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.surfaceAlt : "transparent",
        borderBottom: `1px solid ${t.border}`,
        transition: "background 0.15s",
      }}
    >
      <td style={{ padding: "10px 20px", color: t.textSecondary, fontWeight: 600, letterSpacing: "0.04em" }}>
        {job.jobId}
      </td>
      <td style={{ padding: "10px 20px", color: t.textPrimary }}>
        {job.type}
      </td>
      <td style={{ padding: "10px 20px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: status.color,
          border: `1px solid ${status.color}30`, background: `${status.color}10`,
          padding: "2px 8px", borderRadius: 3,
        }}>
          {status.dot} {status.label}
        </span>
      </td>
      <td style={{ padding: "10px 20px", color: t.textSecondary }}>
        {job.workerId || <span style={{ color: t.textMuted }}>—</span>}
      </td>
      <td style={{ padding: "10px 20px", color: job.retryCount > 0 ? COLORS.amber : t.textMuted }}>
        {job.retryCount}
      </td>
      <td style={{ padding: "10px 20px", color: job.latencyMs ? t.textPrimary : t.textMuted }}>
        {job.latencyMs
          ? <span>{job.latencyMs}<span style={{ color: t.textMuted, fontSize: 9 }}> ms</span></span>
          : "—"}
      </td>
    </tr>
  );
}