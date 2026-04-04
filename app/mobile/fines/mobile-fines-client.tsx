"use client"

import { useState } from "react"
import { MobileCard, MobileBadge, MobileSelect, MobileButton, MobileSectionTitle } from "../components/mobile-ui"

function formatUGX(cents: number) { return `UGX ${(cents / 100).toLocaleString("en-UG")}` }
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

export function MobileFinesClient({ fines }: { fines: any[] }) {
  const [payingId, setPayingId] = useState<string | null>(null)
  const [method, setMethod] = useState("cash")
  const [loading, setLoading] = useState(false)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState("")

  const pending = fines.filter((f) => f.status === "pending" && !paidIds.has(f.id))
  const totalPending = pending.reduce((s, f) => s + f.amount, 0)
  const settled = fines.filter((f) => f.status !== "pending" || paidIds.has(f.id))

  const handlePay = async (fine: any) => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/mobile/pay-fine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fine_id: fine.id, payment_method: method }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Payment failed"); return }
      setPaidIds((prev) => new Set([...prev, fine.id]))
      setPayingId(null)
    } catch { setError("Network error. Try again.") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* Summary Banner */}
      {pending.length > 0 ? (
        <div style={{ margin: "0 16px 14px", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#fca5a5" }}>{pending.length} Outstanding Fine{pending.length > 1 ? "s" : ""}</p>
              <p style={{ fontSize: "11px", color: "#f87171" }}>Total: {formatUGX(totalPending)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ margin: "0 16px 14px", background: "#0f2e1a", border: "1px solid #14532d", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>All fines settled — great job!</p>
        </div>
      )}

      {error && <div style={{ margin: "0 16px 10px", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#fca5a5" }}>{error}</div>}

      {/* Pending Fines */}
      {pending.length > 0 && <MobileSectionTitle>Pending Fines</MobileSectionTitle>}
      {pending.map((fine) => {
        const pc = priorityColors[fine.priority ?? "normal"]
        const isExpanded = payingId === fine.id
        return (
          <MobileCard key={fine.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b" }}>{fine.fine_ref ?? "—"}</span>
                  <span style={{ background: pc.bg, color: pc.color, fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>{fine.priority ?? "normal"}</span>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>{fine.reason ?? "Fine"}</p>
                {fine.description && <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{fine.description}</p>}
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  {fine.category_name ?? ""} · Issued: {formatDate(fine.created_at)}
                  {fine.due_date ? ` · Due: ${formatDate(fine.due_date)}` : ""}
                </p>
              </div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#f87171", flexShrink: 0 }}>{formatUGX(fine.amount)}</p>
            </div>

            {isExpanded ? (
              <div style={{ marginTop: "10px", borderTop: "1px solid #334155", paddingTop: "10px" }}>
                <MobileSelect label="Pay via" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="cash">Cash at Office</option>
                  <option value="mobile_money">MTN Mobile Money</option>
                  <option value="mobile_money">Airtel Money</option>
                  <option value="bank">Bank Transfer</option>
                </MobileSelect>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setPayingId(null)} style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#94a3b8", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Cancel</button>
                  <MobileButton variant="danger" loading={loading} onClick={() => handlePay(fine)} style={{ flex: 1, marginTop: 0 } as any}>
                    Pay {formatUGX(fine.amount)}
                  </MobileButton>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPayingId(fine.id)}
                style={{ width: "100%", marginTop: "10px", background: "#ef4444", border: "none", borderRadius: "8px", padding: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
              >
                Pay This Fine
              </button>
            )}
          </MobileCard>
        )
      })}

      {/* Settled Fines */}
      {settled.length > 0 && (
        <>
          <MobileSectionTitle>Settled Fines</MobileSectionTitle>
          {settled.map((fine) => (
            <MobileCard key={fine.id} style={{ opacity: 0.75 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>{fine.reason ?? "Fine"}</p>
                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{formatDate(fine.created_at)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>{formatUGX(fine.amount)}</p>
                  <MobileBadge status={paidIds.has(fine.id) ? "paid" : fine.status} />
                </div>
              </div>
            </MobileCard>
          ))}
        </>
      )}

      {fines.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><circle cx="12" cy="12" r="10" /><path d="M20 6 9 17l-5-5" /></svg>
          <p style={{ fontSize: "14px", fontWeight: 600 }}>No fines on your account</p>
        </div>
      )}
      <div style={{ height: "16px" }} />
    </div>
  )
}
