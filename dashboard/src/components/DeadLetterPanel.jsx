import { useEffect, useState } from "react";
import { COLORS } from "../constants";

export default function DeadLetterPanel({ t }) {
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [replaying, setReplaying] = useState(null); // jobId currently being replayed

  const fetchJobs = async () => {
    try {
      const res  = await fetch("http://localhost:3000/jobs/dead-letter");
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, []);

  const replayJob = async (jobId) => {
    setReplaying(jobId);
    try {
      await fetch(`http://localhost:3000/jobs/${jobId}/replay`, { method: "POST" });
      await fetchJobs(); // refresh list after replay
    } catch (e) {
      console.error(e);
    } finally {
      setReplaying(null);
    }
  };

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 8, overflow: "hidden", marginBottom: 16,
    }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 20px", borderBottom: `1px solid ${t.border}`,
        background: `${COLORS.red}08`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: COLORS.red, fontSize: 13 }}>⊗</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: t.textSecondary,
          }}>
            DEAD LETTER QUEUE
          </span>
          {jobs.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              color: COLORS.red, background: `${COLORS.red}15`,
              border: `1px solid ${COLORS.red}30`, padding: "2px 8px", borderRadius: 3,
            }}>
              {jobs.length} FAILED
            </span>
          )}
        </div>
        <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.08em" }}>
          {loading ? "LOADING…" : "AUTO-REFRESH 5s"}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {["JOB ID", "TYPE", "ERROR", "RETRIES", "FAILED AT", "ACTION"].map(col => (
                <th key={col} style={{
                  padding: "8px 20px", textAlign: "left",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  color: t.textMuted, whiteSpace: "nowrap",
                }}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!loading && jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: "32px 20px", textAlign: "center",
                  color: t.textMuted, fontSize: 11, letterSpacing: "0.08em",
                }}>
                  ✓ NO DEAD-LETTERED JOBS
                </td>
              </tr>
            ) : (
              jobs.map(job => (
                <DeadLetterRow
                  key={job.jobId}
                  job={job}
                  t={t}
                  isReplaying={replaying === job.jobId}
                  onReplay={replayJob}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeadLetterRow({ job, t, isReplaying, onReplay }) {
  const [hov, setHov] = useState(false);

  const failedAt = job.updatedAt
    ? new Date(job.updatedAt).toLocaleTimeString()
    : "—";

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${COLORS.red}06` : "transparent",
        borderBottom: `1px solid ${t.border}`,
        transition: "background 0.15s",
      }}
    >
      {/* Job ID */}
      <td style={{ padding: "10px 20px", color: t.textSecondary, fontWeight: 600, letterSpacing: "0.04em" }}>
        {job.jobId}
      </td>

      {/* Type */}
      <td style={{ padding: "10px 20px", color: t.textPrimary }}>
        {job.type}
      </td>

      {/* Error message — truncated */}
      <td style={{ padding: "10px 20px", maxWidth: 260 }}>
        <span title={job.errorMessage} style={{
          color: COLORS.red, fontSize: 10, opacity: 0.85,
          display: "block", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {job.errorMessage || "—"}
        </span>
      </td>

      {/* Retry count */}
      <td style={{ padding: "10px 20px", color: COLORS.amber, fontWeight: 700 }}>
        {job.retryCount ?? "—"}
      </td>

      {/* Failed at */}
      <td style={{ padding: "10px 20px", color: t.textMuted, fontSize: 10 }}>
        {failedAt}
      </td>

      {/* Replay button */}
      <td style={{ padding: "10px 20px" }}>
        <button
          onClick={() => onReplay(job.jobId)}
          disabled={isReplaying}
          style={{
            background: isReplaying ? t.surfaceAlt : `${COLORS.blue}18`,
            border: `1px solid ${isReplaying ? t.border : COLORS.blue + "50"}`,
            borderRadius: 4, padding: "4px 14px", cursor: isReplaying ? "not-allowed" : "pointer",
            color: isReplaying ? t.textMuted : COLORS.blue,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            fontFamily: "inherit", transition: "all 0.15s",
          }}
        >
          {isReplaying ? "REPLAYING…" : "↺ REPLAY"}
        </button>
      </td>
    </tr>
  );
}