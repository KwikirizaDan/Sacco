"use client"

import { useState } from "react"
import { MobileCard, MobileBadge, MobileInput, MobileSelect, MobileTextarea, MobileButton, MobileSectionTitle } from "../components/mobile-ui"

function formatDate(d: any) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })
}

const priorityColors: Record<string, { bg: string; color: string }> = {
  low: { bg: "#1e293b", color: "#94a3b8" },
  normal: { bg: "#172554", color: "#60a5fa" },
  high: { bg: "#422006", color: "#fb923c" },
  urgent: { bg: "#450a0a", color: "#f87171" },
}

const categoryLabels: Record<string, string> = {
  general: "General", loan: "Loan", savings: "Savings",
  service: "Service", technical: "Technical", other: "Other",
}

export function MobileSupportClient({ complaints }: { complaints: any[] }) {
  const [tab, setTab] = useState<"new" | "history">("new")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState("general")
  const [priority, setPriority] = useState("normal")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!subject.trim()) { setError("Please enter a subject"); return }
    if (!body.trim() || body.length < 10) { setError("Please provide more detail (min 10 characters)"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/mobile/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, category, priority }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Submission failed"); return }
      setSuccess(true); setSubject(""); setBody("")
      setTimeout(() => { setSuccess(false); setTab("history") }, 2000)
    } catch { setError("Network error. Try again.") }
    finally { setLoading(false) }
  }

  const openComplaints = complaints.filter((c) => c.status !== "resolved")
  const resolved = complaints.filter((c) => c.status === "resolved")

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", margin: "0 16px 14px", background: "#1e293b", borderRadius: "10px", padding: "3px" }}>
        {(["new", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, background: tab === t ? "#f97316" : "none", border: "none", borderRadius: "8px", padding: "9px", color: tab === t ? "#fff" : "#64748b", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Poppins, sans-serif", transition: "all 0.2s" }}>
            {t === "new" ? "New Complaint" : `History (${complaints.length})`}
          </button>
        ))}
      </div>

      {/* New complaint form */}
      {tab === "new" && (
        <>
          {success && (
            <div style={{ margin: "0 16px 14px", background: "#0f2e1a", border: "1px solid #14532d", borderRadius: "12px", padding: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>Complaint Submitted!</p>
              <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>We'll review your complaint and respond via SMS.</p>
            </div>
          )}
          <MobileCard>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Submit a Complaint</p>
            <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}>Describe your issue clearly. We'll respond via SMS.</p>
            {error && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#fca5a5", marginBottom: "10px" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <MobileSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </MobileSelect>
              <MobileSelect label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </MobileSelect>
            </div>
            <MobileInput label="Subject *" type="text" placeholder="e.g. Loan balance incorrect" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <MobileTextarea label="Description *" placeholder="Describe your issue in detail..." value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <MobileButton loading={loading} onClick={handleSubmit}>Submit Complaint</MobileButton>
          </MobileCard>
        </>
      )}

      {/* History tab */}
      {tab === "history" && (
        <>
          {complaints.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No complaints submitted yet</p>
            </div>
          ) : (
            <>
              {openComplaints.length > 0 && (
                <>
                  <MobileSectionTitle>Open ({openComplaints.length})</MobileSectionTitle>
                  {openComplaints.map((c) => {
                    const pc = priorityColors[c.priority ?? "normal"]
                    return (
                      <MobileCard key={c.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", flex: 1, paddingRight: "8px" }}>{c.subject}</p>
                          <MobileBadge status={c.status} />
                        </div>
                        <p style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5, marginBottom: "6px" }}>{c.body}</p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#475569" }}>{c.complaint_ref ?? "—"}</span>
                          <span style={{ background: pc.bg, color: pc.color, fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>{c.priority}</span>
                          <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>{formatDate(c.created_at)}</span>
                        </div>
                      </MobileCard>
                    )
                  })}
                </>
              )}

              {resolved.length > 0 && (
                <>
                  <MobileSectionTitle>Resolved ({resolved.length})</MobileSectionTitle>
                  {resolved.map((c) => (
                    <MobileCard key={c.id} style={{ opacity: 0.8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", flex: 1 }}>{c.subject}</p>
                        <MobileBadge status="resolved" />
                      </div>
                      {c.resolution_notes && (
                        <div style={{ background: "#0f2e1a", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px" }}>
                          <p style={{ fontSize: "10px", color: "#4ade80", fontWeight: 600, marginBottom: "2px" }}>Resolution</p>
                          <p style={{ fontSize: "11px", color: "#64748b" }}>{c.resolution_notes}</p>
                        </div>
                      )}
                      <p style={{ fontSize: "10px", color: "#475569" }}>{c.complaint_ref ?? "—"} · {formatDate(c.created_at)}</p>
                    </MobileCard>
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
      <div style={{ height: "16px" }} />
    </div>
  )
}
