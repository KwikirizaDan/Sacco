"use client"

import { useRouter } from "next/navigation"

// ─── Status Bar ───────────────────────────────────────────────────────────────
export function MobileStatusBar({ title = "SACCO" }: { title?: string }) {
  const now = new Date()
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false })
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 4px", background: "#0f172a" }}>
      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>{time}</span>
      <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 700, letterSpacing: "1px" }}>{title}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
        <svg width="15" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0" y="4" width="2.5" height="6" rx="1" fill="#475569" />
          <rect x="3.5" y="3" width="2.5" height="7" rx="1" fill="#475569" />
          <rect x="7" y="1.5" width="2.5" height="8.5" rx="1" fill="#f1f5f9" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="1" fill="#f1f5f9" />
        </svg>
      </div>
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function MobilePageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div style={{ padding: "12px 16px 10px", background: "#0f1623" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {back && (
            <button
              onClick={() => router.back()}
              style={{ background: "#1e293b", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function MobileStatCard({ label, value, color = "#f1f5f9", sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "12px 14px" }}>
      <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "18px", fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{sub}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function MobileBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: "#14532d", color: "#4ade80" },
    pending: { bg: "#422006", color: "#fb923c" },
    approved: { bg: "#172554", color: "#60a5fa" },
    disbursed: { bg: "#2e1065", color: "#c084fc" },
    settled: { bg: "#1e293b", color: "#94a3b8" },
    declined: { bg: "#450a0a", color: "#f87171" },
    paid: { bg: "#14532d", color: "#4ade80" },
    waived: { bg: "#1e293b", color: "#94a3b8" },
    in_progress: { bg: "#172554", color: "#60a5fa" },
    resolved: { bg: "#14532d", color: "#4ade80" },
    open: { bg: "#422006", color: "#fb923c" },
  }
  const s = map[status] ?? { bg: "#1e293b", color: "#94a3b8" }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", display: "inline-block" }}>
      {status.replace("_", " ")}
    </span>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────
export function MobileSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 16px 8px" }}>
      {children}
    </p>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function MobileCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ margin: "0 16px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "14px 16px", ...style }}>
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function MobileInput({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "5px" }}>{label}</label>}
      <input
        {...props}
        style={{
          width: "100%",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "11px 14px",
          fontSize: "14px",
          color: "#f1f5f9",
          outline: "none",
          fontFamily: "Poppins, sans-serif",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function MobileSelect({ label, children, ...props }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "5px" }}>{label}</label>}
      <select
        {...props}
        style={{
          width: "100%",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "11px 14px",
          fontSize: "14px",
          color: "#f1f5f9",
          outline: "none",
          fontFamily: "Poppins, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {children}
      </select>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function MobileButton({
  children,
  variant = "primary",
  loading,
  ...props
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger" | "success"
  loading?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const colors = {
    primary: { bg: "#f97316", color: "#fff" },
    secondary: { bg: "#1e293b", color: "#f1f5f9" },
    danger: { bg: "#ef4444", color: "#fff" },
    success: { bg: "#10b981", color: "#fff" },
  }
  const c = colors[variant]
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: "100%",
        background: props.disabled ? "#1e293b" : c.bg,
        border: variant === "secondary" ? "1px solid #334155" : "none",
        borderRadius: "10px",
        padding: "13px",
        color: props.disabled ? "#475569" : c.color,
        fontSize: "14px",
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontFamily: "Poppins, sans-serif",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "opacity 0.15s",
      }}
    >
      {loading ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function MobileTextarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "5px" }}>{label}</label>}
      <textarea
        {...props}
        style={{
          width: "100%",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "11px 14px",
          fontSize: "14px",
          color: "#f1f5f9",
          outline: "none",
          fontFamily: "Poppins, sans-serif",
          resize: "none",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
export function MobileInfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: "13px", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{value ?? "—"}</span>
    </div>
  )
}
