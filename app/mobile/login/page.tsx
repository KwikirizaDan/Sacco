"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type Step = "phone" | "otp" | "success"

export default function MobileLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [memberName, setMemberName] = useState("")
  const [maskedPhone, setMaskedPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [resend, setResend] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    setResend(60)
    timerRef.current = setInterval(() => {
      setResend((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return v - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const normalizePhone = (v: string) => v.replace(/\D/g, "").slice(0, 9)

  const sendOtp = async () => {
    setError("")
    if (phone.length < 9) { setError("Enter a valid 9-digit number"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/mobile/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return }
      setMemberName(data.memberName)
      setMaskedPhone(data.masked)
      if (data.devOtp) setDevOtp(data.devOtp)
      setStep("otp")
      startTimer()
      setTimeout(() => inputRefs.current[0]?.focus(), 300)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (!val && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = [...otp]
    text.split("").forEach((c, i) => { next[i] = c })
    setOtp(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  const verifyOtp = async () => {
    const code = otp.join("")
    if (code.length < 6) { setError("Enter the 6-digit code"); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/mobile/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Invalid code"); return }
      setStep("success")
      setTimeout(() => router.push("/mobile/home"), 1600)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const C = {
    wrap: { minHeight: "100dvh", background: "#0f1623", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "28px 24px", fontFamily: "Poppins, sans-serif" },
    logo: { width: "64px", height: "64px", background: "#f97316", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 800, color: "#fff", margin: "0 auto 16px" },
    title: { fontSize: "24px", fontWeight: 800, color: "#f1f5f9", textAlign: "center" as const },
    sub: { fontSize: "13px", color: "#64748b", textAlign: "center" as const, marginTop: "6px", lineHeight: 1.7, marginBottom: "28px" },
    label: { fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" },
    inp: { width: "100%", background: "#1e293b", border: "1.5px solid #334155", borderRadius: "10px", padding: "13px 14px", fontSize: "15px", color: "#f1f5f9", outline: "none", fontFamily: "Poppins, sans-serif", boxSizing: "border-box" as const },
    btn: (enabled: boolean) => ({ width: "100%", background: enabled ? "#f97316" : "#1e293b", border: "none", borderRadius: "10px", padding: "14px", color: enabled ? "#fff" : "#475569", fontSize: "15px", fontWeight: 700, cursor: enabled ? "pointer" : "not-allowed", fontFamily: "Poppins, sans-serif", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }),
    err: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#fca5a5", marginBottom: "10px" },
    steps: { display: "flex", gap: "6px", justifyContent: "center", marginBottom: "24px" },
    dot: (active: boolean) => ({ height: "6px", width: active ? "22px" : "6px", borderRadius: "3px", background: active ? "#f97316" : "#1e293b", transition: "all 0.3s" }),
    otpBox: (filled: boolean) => ({ width: "44px", height: "54px", background: filled ? "#1c1917" : "#1e293b", border: `1.5px solid ${filled ? "#f97316" : "#334155"}`, borderRadius: "10px", fontSize: "22px", fontWeight: 800, color: "#f97316", textAlign: "center" as const, outline: "none", fontFamily: "Poppins, sans-serif", transition: "border-color 0.2s", caretColor: "#f97316" }),
  }

  return (
    <div style={C.wrap}>
      {/* Step dots */}
      <div style={C.steps}>
        {["phone", "otp", "success"].map((s, i) => (
          <div key={s} style={C.dot(step === s || (step === "success" && i === 2) || (step === "otp" && i === 1) || (step === "phone" && i === 0))} />
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* ── STEP 1: Phone ── */}
        {step === "phone" && (
          <>
            <div style={C.logo}>S</div>
            <h1 style={C.title}>SACCO Member Portal</h1>
            <p style={C.sub}>Enter your registered phone number to receive a one-time login code via SMS</p>
            {error && <div style={C.err}>{error}</div>}
            <label style={C.label}>Phone Number</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "0" }}>
              <div style={{ background: "#1e293b", border: "1.5px solid #334155", borderRadius: "10px", padding: "13px 14px", fontSize: "14px", color: "#94a3b8", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                🇺🇬 +256
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(normalizePhone(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="7XX XXX XXX"
                style={{ ...C.inp, flex: 1 }}
                autoFocus
              />
            </div>
            <button style={C.btn(phone.length === 9 && !loading)} onClick={sendOtp} disabled={phone.length !== 9 || loading}>
              {loading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              )}
              {loading ? "Sending Code..." : "Send OTP via SMS"}
            </button>
            <div style={{ textAlign: "center", marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span style={{ fontSize: "11px", color: "#475569" }}>Powered by EgoSMS · Secure login</span>
            </div>
          </>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <>
            <div style={{ ...C.logo, background: "#1e293b" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <h1 style={C.title}>Check your SMS</h1>
            <p style={C.sub}>
              We sent a 6-digit code to<br />
              <strong style={{ color: "#f97316" }}>{maskedPhone}</strong><br />
              Welcome back, <strong style={{ color: "#f1f5f9" }}>{memberName}</strong>
            </p>
            {devOtp && (
              <div style={{ background: "#1e293b", border: "1px solid #f97316", borderRadius: "8px", padding: "8px 12px", fontSize: "11px", color: "#f97316", marginBottom: "10px", textAlign: "center" }}>
                DEV MODE — OTP: <strong>{devOtp}</strong>
              </div>
            )}
            {error && <div style={C.err}>{error}</div>}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px" }} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  id={`otp-${i}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && i > 0) inputRefs.current[i - 1]?.focus()
                    if (e.key === "Enter") verifyOtp()
                  }}
                  style={C.otpBox(!!digit)}
                  inputMode="numeric"
                />
              ))}
            </div>
            <button style={C.btn(otp.join("").length === 6 && !loading)} onClick={verifyOtp} disabled={otp.join("").length !== 6 || loading}>
              {loading ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> : null}
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError("") }} style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", fontFamily: "Poppins, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                Change number
              </button>
              <button
                onClick={() => { if (resend === 0) sendOtp() }}
                disabled={resend > 0}
                style={{ background: "none", border: "none", color: resend > 0 ? "#475569" : "#f97316", fontSize: "12px", cursor: resend > 0 ? "not-allowed" : "pointer", fontFamily: "Poppins, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
                {resend > 0 ? `Resend in ${resend}s` : "Resend Code"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ ...C.logo, background: "#0f2e1a", color: "#4ade80" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h1 style={{ ...C.title, color: "#4ade80" }}>Verified!</h1>
            <p style={C.sub}>
              Welcome back, <strong style={{ color: "#f1f5f9" }}>{memberName}</strong><br />
              Taking you to your dashboard...
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f2e1a", border: "1px solid #14532d", borderRadius: "20px", padding: "6px 16px" }}>
                <div style={{ width: "8px", height: "8px", background: "#4ade80", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 600 }}>Signing you in...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #f97316 !important; }
      `}</style>
    </div>
  )
}
