"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString("en-UG")}`
}

function formatDate(d: Date | null | string | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "short" })
}

const TX_META: Record<string, { label: string; iconBg: string; iconColor: string; amountColor: string; sign: string }> = {
  savings_deposit: { label: "Savings Deposit", iconBg: "#14532d", iconColor: "#4ade80", amountColor: "#4ade80", sign: "+" },
  savings_withdrawal: { label: "Withdrawal", iconBg: "#450a0a", iconColor: "#f87171", amountColor: "#f87171", sign: "-" },
  loan_disbursement: { label: "Loan Disbursed", iconBg: "#1c0a00", iconColor: "#fb923c", amountColor: "#fb923c", sign: "-" },
  loan_repayment: { label: "Loan Repayment", iconBg: "#1e1b4b", iconColor: "#818cf8", amountColor: "#818cf8", sign: "+" },
  fine_payment: { label: "Fine Payment", iconBg: "#422006", iconColor: "#fbbf24", amountColor: "#fbbf24", sign: "-" },
}

// ─── Inline line chart ────────────────────────────────────────────────────────
function LineChart({ data }: { data: { month: string; savings: number; loans: number }[] }) {
  const W = 320, H = 100
  const maxVal = Math.max(...data.flatMap((d) => [d.savings, d.loans]), 1)

  const pointsFor = (key: "savings" | "loans") =>
    data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * (W - 20) + 10
        const y = H - 16 - ((d[key] / maxVal) * (H - 24))
        return `${x},${y}`
      })
      .join(" ")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100px" }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1="10" y1={H - 16 - p * (H - 24)} x2={W - 10} y2={H - 16 - p * (H - 24)} stroke="#1e293b" strokeWidth="1" />
      ))}
      {/* Savings line */}
      <polyline points={pointsFor("savings")} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Loans line */}
      <polyline points={pointsFor("loans")} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (W - 20) + 10
        const sy = H - 16 - ((d.savings / maxVal) * (H - 24))
        const ly = H - 16 - ((d.loans / maxVal) * (H - 24))
        return (
          <g key={i}>
            <circle cx={x} cy={sy} r="3" fill="#10b981" />
            <circle cx={x} cy={ly} r="3" fill="#818cf8" />
            <text x={x} y={H - 2} textAnchor="middle" fontSize="9" fill="#475569">{d.month}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Quick action button ──────────────────────────────────────────────────────
function QA({ href, label, color, bg, path }: { href: string; label: string; color: string; bg: string; path: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "12px 4px", background: bg, border: `1px solid ${color}30`, borderRadius: "12px", cursor: "pointer" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
        <span style={{ fontSize: "9px", fontWeight: 700, color, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
      </div>
    </Link>
  )
}

interface Props {
  member: { full_name: string; member_code: string; status: string }
  totalSavings: number
  activeLoans: number
  pendingFines: number
  transactions: any[]
  chartData: { month: string; savings: number; loans: number }[]
}

export function MobileHomeClient({ member, totalSavings, activeLoans, pendingFines, transactions, chartData }: Props) {
  const initials = member.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Greeting */}
      <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "11px", color: "#64748b" }}>Good day,</p>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#f1f5f9" }}>{member.full_name.split(" ")[0]}</h2>
        </div>
        <Link href="/mobile/profile">
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", cursor: "pointer" }}>
            {initials}
          </div>
        </Link>
      </div>

      {/* Hero Balance Card */}
      <div style={{ margin: "0 16px 14px", borderRadius: "18px", padding: "18px 20px", background: "linear-gradient(135deg,#f97316,#c2410c)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", top: "-20px", width: "110px", height: "110px", background: "rgba(255,255,255,0.07)", borderRadius: "50%" }} />
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginBottom: "3px" }}>Total Savings Balance</p>
        <p style={{ fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{formatUGX(totalSavings)}</p>
        <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
          <div>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)" }}>Active Loans</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{formatUGX(activeLoans)}</p>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.2)" }} />
          <div style={{ paddingLeft: "12px" }}>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)" }}>Pending Fines</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: pendingFines > 0 ? "#fbbf24" : "#fff" }}>{formatUGX(pendingFines)}</p>
          </div>
        </div>
        <div style={{ marginTop: "10px", display: "inline-block", background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "2px 10px", fontSize: "9px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
          {member.member_code}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", padding: "0 16px 14px" }}>
        <QA href="/mobile/deposit" label="Deposit" color="#10b981" bg="#0f2e1a" path={<><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>} />
        <QA href="/mobile/withdraw" label="Withdraw" color="#f97316" bg="#1c0a00" path={<><path d="M12 5v14" /><path d="M5 12l7 7 7-7" /></>} />
        <QA href="/mobile/loans" label="Request Loan" color="#818cf8" bg="#1e1b4b" path={<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>} />
        <QA href="/mobile/fines" label="Pay Fine" color="#f87171" bg="#450a0a" path={<><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></>} />
      </div>

      {/* Savings vs Loans Chart */}
      <div style={{ margin: "0 16px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>Savings vs Loans</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: "9px", color: "#64748b" }}>Savings</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#818cf8" }} />
              <span style={{ fontSize: "9px", color: "#64748b" }}>Loans</span>
            </div>
          </div>
        </div>
        <LineChart data={chartData} />
      </div>

      {/* Recent Transactions */}
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "0 16px 8px" }}>Recent Transactions</p>
      <div style={{ padding: "0 16px" }}>
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#475569", fontSize: "13px" }}>No transactions yet</div>
        ) : (
          transactions.map((tx) => {
            const meta = TX_META[tx.type] ?? { label: tx.type, iconBg: "#1e293b", iconColor: "#94a3b8", amountColor: "#94a3b8", sign: "" }
            return (
              <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: meta.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={meta.iconColor} strokeWidth="2.5" strokeLinecap="round">
                    <path d={meta.sign === "+" ? "M12 19V5m-7 7 7-7 7 7" : "M12 5v14m-7-7 7 7 7-7"} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{tx.narration ?? meta.label}</p>
                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>{formatDate(tx.created_at)}</p>
                </div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: meta.amountColor }}>{meta.sign}{formatUGX(tx.amount)}</p>
              </div>
            )
          })
        )}
      </div>
      <div style={{ height: "16px" }} />
    </div>
  )
}
