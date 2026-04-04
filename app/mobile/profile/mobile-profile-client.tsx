"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MobileCard, MobileBadge, MobileInfoRow, MobileSectionTitle } from "../components/mobile-ui"

function formatUGX(cents: number) { return `UGX ${(cents / 100).toLocaleString("en-UG")}` }
function formatDate(d: any) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  registration_form: "Registration Form",
  loan_contract: "Loan Contract",
  membership_certificate: "Membership Certificate",
  other: "Other",
}

const DOC_TYPE_COLORS: Record<string, string> = {
  national_id: "#3b82f6",
  registration_form: "#10b981",
  loan_contract: "#f97316",
  membership_certificate: "#a855f7",
  other: "#64748b",
}

interface Props {
  member: {
    id: string; full_name: string; member_code: string; phone: string | null
    email: string | null; national_id: string | null; address: string | null
    date_of_birth: string | null; next_of_kin: string | null; next_of_kin_phone: string | null
    status: string; joined_at: Date | null
  }
  stats: { totalSavings: number; savingsAccounts: number; totalLoans: number; transactions: number }
  documents: any[]
}

export function MobileProfileClient({ member, stats, documents }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [docTab, setDocTab] = useState<string | null>(null)

  const initials = member.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setLoggingOut(true)
    await fetch("/api/mobile/logout", { method: "POST" })
    router.push("/mobile/login")
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Avatar + Name */}
      <div style={{ padding: "8px 16px 16px", textAlign: "center" }}>
        <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 auto 10px" }}>{initials}</div>
        <p style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9" }}>{member.full_name}</p>
        <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b", marginTop: "3px" }}>{member.member_code}</p>
        <div style={{ marginTop: "8px", display: "flex", justifyContent: "center" }}>
          <MobileBadge status={member.status} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", padding: "0 16px 14px" }}>
        {[
          { label: "Savings", value: formatUGX(stats.totalSavings), color: "#4ade80" },
          { label: "Accounts", value: stats.savingsAccounts, color: "#f97316" },
          { label: "Loans", value: stats.totalLoans, color: "#818cf8" },
          { label: "Tx", value: stats.transactions, color: "#fb923c" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#1e293b", borderRadius: "10px", padding: "10px 8px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <MobileSectionTitle>Personal Information</MobileSectionTitle>
      <MobileCard>
        <MobileInfoRow label="Full Name" value={member.full_name} />
        <MobileInfoRow label="Phone" value={member.phone} />
        <MobileInfoRow label="Email" value={member.email} />
        <MobileInfoRow label="National ID" value={member.national_id} />
        <MobileInfoRow label="Date of Birth" value={formatDate(member.date_of_birth)} />
        <MobileInfoRow label="Address" value={member.address} />
        <MobileInfoRow label="Next of Kin" value={member.next_of_kin} />
        <MobileInfoRow label="NOK Phone" value={member.next_of_kin_phone} />
        <MobileInfoRow label="Member Since" value={formatDate(member.joined_at)} />
        <MobileInfoRow label="Status" value={member.status} />
      </MobileCard>

      {/* Documents */}
      <MobileSectionTitle>My Documents ({documents.length})</MobileSectionTitle>
      {documents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#475569", fontSize: "12px" }}>No documents on file. Contact your SACCO admin.</div>
      ) : (
        <div style={{ padding: "0 16px" }}>
          {documents.map((doc) => {
            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name ?? "")
            const isPdf = /\.pdf$/i.test(doc.file_name ?? "")
            const typeColor = DOC_TYPE_COLORS[doc.type] ?? "#64748b"
            const typeLabel = DOC_TYPE_LABELS[doc.type] ?? doc.type
            return (
              <div key={doc.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: `${typeColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {isImage ? (
                      <img src={doc.blob_url} alt={doc.file_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.file_name}</p>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                      <span style={{ background: `${typeColor}20`, color: typeColor, fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>{typeLabel}</span>
                      <span style={{ fontSize: "10px", color: "#475569" }}>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  <a href={doc.blob_url} target="_blank" rel="noopener noreferrer" style={{ background: "#334155", border: "none", borderRadius: "8px", padding: "7px 10px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>View</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sign Out */}
      <div style={{ padding: "16px" }}>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "13px", color: "#ef4444", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "Poppins, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {loggingOut ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          )}
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ height: "8px" }} />
    </div>
  )
}
