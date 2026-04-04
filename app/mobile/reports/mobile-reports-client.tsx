"use client"

import { useState } from "react"
import { MobileCard, MobileStatCard, MobileBadge } from "../components/mobile-ui"

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString("en-UG")}`
}
function formatDate(d: any) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })
}

const TX_META: Record<string, { label: string; iconBg: string; iconColor: string; amountColor: string; sign: string }> = {
  savings_deposit: { label: "Savings Deposit", iconBg: "#14532d", iconColor: "#4ade80", amountColor: "#4ade80", sign: "+" },
  savings_withdrawal: { label: "Withdrawal", iconBg: "#450a0a", iconColor: "#f87171", amountColor: "#f87171", sign: "-" },
  loan_disbursement: { label: "Loan Disbursed", iconBg: "#1c0a00", iconColor: "#fb923c", amountColor: "#fb923c", sign: "-" },
  loan_repayment: { label: "Loan Repayment", iconBg: "#1e1b4b", iconColor: "#818cf8", amountColor: "#818cf8", sign: "+" },
  fine_payment: { label: "Fine Payment", iconBg: "#422006", iconColor: "#fbbf24", amountColor: "#fbbf24", sign: "-" },
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "savings_deposit", label: "Deposits" },
  { key: "savings_withdrawal", label: "Withdrawals" },
  { key: "loan_repayment,loan_disbursement", label: "Loans" },
  { key: "fine_payment", label: "Fines" },
]

interface Props {
  member: { full_name: string; member_code: string }
  transactions: any[]
  stats: { totalSavings: number; totalLoans: number; totalFines: number; txCount: number }
}

export function MobileReportsClient({ member, transactions, stats }: Props) {
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((tx) => filter.split(",").includes(tx.type))

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const rows = filtered.map((tx) => {
      const meta = TX_META[tx.type] ?? { label: tx.type, sign: "" }
      return `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 12px;font-size:12px">${formatDate(tx.created_at)}</td>
          <td style="padding:8px 12px;font-size:12px">${meta.label}</td>
          <td style="padding:8px 12px;font-size:12px">${tx.narration ?? "—"}</td>
          <td style="padding:8px 12px;font-size:12px;text-align:right;color:${meta.sign === "+" ? "#16a34a" : "#dc2626"};font-weight:700">${meta.sign}${formatUGX(tx.amount)}</td>
          <td style="padding:8px 12px;font-size:12px">${tx.payment_method ?? "—"}</td>
        </tr>`
    }).join("")

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>SACCO Transaction Report</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f3f4f6;padding:8px 12px;text-align:left;font-size:12px}@media print{button{display:none}}</style>
      </head><body>
      <h1>SACCO Transaction Report</h1>
      <p>Member: <strong>${member.full_name}</strong> · Code: ${member.member_code}</p>
      <p>Generated: ${new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}</p>
      <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th style="text-align:right">Amount</th><th>Method</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:12px;color:#666">
        <span>Total Savings: ${formatUGX(stats.totalSavings)}</span>
        <span>Active Loans: ${formatUGX(stats.totalLoans)}</span>
        <span>${filtered.length} transactions shown</span>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`)
    printWindow.document.close()
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "0 16px 14px" }}>
        <MobileStatCard label="Total Savings" value={formatUGX(stats.totalSavings)} color="#4ade80" />
        <MobileStatCard label="Active Loans" value={formatUGX(stats.totalLoans)} color="#818cf8" />
        <MobileStatCard label="Fines Paid" value={formatUGX(stats.totalFines)} color="#f87171" />
        <MobileStatCard label="Transactions" value={stats.txCount} color="#f97316" />
      </div>

      {/* Filter + Print row */}
      <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ background: filter === f.key ? "#f97316" : "#1e293b", border: `1px solid ${filter === f.key ? "#f97316" : "#334155"}`, borderRadius: "20px", padding: "5px 12px", fontSize: "11px", fontWeight: 600, color: filter === f.key ? "#fff" : "#64748b", whiteSpace: "nowrap", cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={handlePrint} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Print</span>
        </button>
      </div>

      <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "0 16px 8px" }}>
        {filtered.length} transactions
      </p>

      <div style={{ padding: "0 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: "13px" }}>No transactions</div>
        ) : (
          filtered.map((tx) => {
            const meta = TX_META[tx.type] ?? { label: tx.type, iconBg: "#1e293b", iconColor: "#94a3b8", amountColor: "#94a3b8", sign: "" }
            return (
              <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: meta.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.iconColor} strokeWidth="2.5" strokeLinecap="round">
                    <path d={meta.sign === "+" ? "M12 19V5m-7 7 7-7 7 7" : "M12 5v14m-7-7 7 7 7-7"} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{tx.narration ?? meta.label}</p>
                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>
                    {formatDate(tx.created_at)} · {tx.payment_method ?? "cash"}
                  </p>
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
