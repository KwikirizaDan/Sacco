"use client"

import { useState, useEffect } from "react"
import {
  MobileCard,
  MobileBadge,
  MobileInput,
  MobileSelect,
  MobileButton,
  MobileTextarea,
  MobileSectionTitle,
} from "../components/mobile-ui"

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString("en-UG")}`
}
function formatDate(d: any) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

declare global {
  interface Window {
    FlutterwaveCheckout: any
  }
}

interface Props {
  member: {
    id: string
    full_name: string
    member_code: string
    phone: string | null
  }
  loans: any[]
  saccoId: string
}

export function MobileLoansClient({ member, loans, saccoId }: Props) {
  const [amount, setAmount] = useState("")
  const [duration, setDuration] = useState("12")
  const [purpose, setPurpose] = useState("")
  const [reason, setReason] = useState("")
  const [repayAmount, setRepayAmount] = useState("")
  const [repayMethod, setRepayMethod] = useState("cash")
  const [loading, setLoading] = useState(false)
  const [repayLoading, setRepayLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [repaySuccess, setRepaySuccess] = useState(false)
  const [error, setError] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.flutterwave.com/v3.js"
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  const activeLoan = loans.find((l) =>
    ["active", "disbursed"].includes(l.status)
  )
  const pendingLoan = loans.find((l) => l.status === "pending")

  const handleRequest = async () => {
    if (!amount || Number(amount) < 1000) {
      setError("Enter a valid amount (min UGX 1,000)")
      return
    }
    if (!purpose.trim()) {
      setError("Please enter the purpose")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mobile/request-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount) * 100,
          duration_months: Number(duration),
          purpose,
          reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Request failed")
        return
      }
      setSuccess(true)
      setAmount("")
      setPurpose("")
      setReason("")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRepay = async () => {
    if (!repayAmount || Number(repayAmount) < 1000) {
      setError("Minimum repayment is UGX 1,000")
      return
    }
    if (!activeLoan) {
      setError("No active loan")
      return
    }
    setRepayLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mobile/repay-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: activeLoan.id,
          amount: Number(repayAmount),
          payment_method: repayMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Repayment failed")
        setRepayLoading(false)
        return
      }

      if (
        repayMethod === "mobile_money" &&
        data.txRef &&
        window.FlutterwaveCheckout
      ) {
        window.FlutterwaveCheckout({
          public_key:
            process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ||
            "FLWPUBK-2d8e0af93e384dc25e0260649e091825-X",
          tx_ref: data.txRef,
          amount: data.amount,
          currency: "UGX",
          payment_options: "mobilemoneyuganda",
          customer: {
            email: data.email || "member@sacco.com",
            phone_number: data.phone,
            name: data.fullname,
          },
          customizations: {
            title: "SACCO Loan Repayment",
            description: `Repayment for ${data.loanRef}`,
          },
          callback: async (response: any) => {
            if (response.status === "successful" || response.tx_ref) {
              await finalizeRepayment(
                activeLoan.id,
                Number(repayAmount) * 100,
                data.txRef
              )
            } else {
              setError("Payment not completed")
            }
            setRepayLoading(false)
          },
          onclose: () => {
            setRepayLoading(false)
          },
        })
      } else {
        await finalizeRepayment(
          activeLoan.id,
          Number(repayAmount) * 100,
          data.txRef
        )
      }
    } catch {
      setError("Network error. Try again.")
      setRepayLoading(false)
    }
  }

  const finalizeRepayment = async (
    loanId: string,
    amountCents: number,
    txRef: string
  ) => {
    setRepayLoading(true)
    try {
      const res = await fetch("/api/mobile/repay-loan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loanId,
          amount: amountCents,
          tx_ref: txRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Repayment confirmation failed")
        return
      }
      setRepaySuccess(true)
      setRepayAmount("")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setRepayLoading(false)
    }
  }

  const repaidPct = activeLoan
    ? Math.round(
        ((activeLoan.amount - activeLoan.balance) / activeLoan.amount) * 100
      )
    : 0

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Active Loan Card */}
      {activeLoan && (
        <div
          style={{
            margin: "0 16px 14px",
            background: "#1e1b4b",
            border: "1px solid #312e81",
            borderRadius: "16px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#818cf8",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Active Loan
            </p>
            <MobileBadge status={activeLoan.status} />
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#f1f5f9" }}>
            {formatUGX(activeLoan.balance)}
          </p>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            <div>
              <p style={{ fontSize: "9px", color: "#818cf8" }}>Monthly</p>
              <p
                style={{ fontSize: "12px", fontWeight: 700, color: "#c7d2fe" }}
              >
                {formatUGX(activeLoan.monthly_payment ?? 0)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "9px", color: "#818cf8" }}>Due Date</p>
              <p
                style={{ fontSize: "12px", fontWeight: 700, color: "#c7d2fe" }}
              >
                {formatDate(activeLoan.due_date)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "9px", color: "#818cf8" }}>Ref</p>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#c7d2fe",
                  fontFamily: "monospace",
                }}
              >
                {activeLoan.loan_ref}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: "10px",
              background: "#1e1b4b",
              borderRadius: "6px",
              overflow: "hidden",
              height: "5px",
              border: "1px solid #312e81",
            }}
          >
            <div
              style={{
                width: `${repaidPct}%`,
                height: "100%",
                background: "#6366f1",
                borderRadius: "6px",
                transition: "width 0.5s",
              }}
            />
          </div>
          <p style={{ fontSize: "9px", color: "#818cf8", marginTop: "3px" }}>
            {repaidPct}% repaid
          </p>
        </div>
      )}

      {/* Repayment Form */}
      {!repaySuccess && activeLoan && (
        <MobileCard>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: "4px",
            }}
          >
            Pay Loan
          </p>
          <p
            style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}
          >
            Make a payment towards your loan.
          </p>
          {error && (
            <div
              style={{
                background: "#450a0a",
                border: "1px solid #7f1d1d",
                borderRadius: "8px",
                padding: "9px 12px",
                fontSize: "12px",
                color: "#fca5a5",
                marginBottom: "10px",
              }}
            >
              {error}
            </div>
          )}
          <MobileInput
            label="Amount (UGX)"
            type="number"
            placeholder={`Min: 1000, Max: ${(activeLoan.balance / 100).toLocaleString()}`}
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
          />
          <MobileSelect
            label="Payment Method"
            value={repayMethod}
            onChange={(e) => setRepayMethod(e.target.value)}
          >
            <option value="cash">Cash at Office</option>
            <option value="mobile_money">Mobile Money (Flutterwave)</option>
          </MobileSelect>
          <MobileButton
            variant="primary"
            loading={repayLoading}
            onClick={handleRepay}
          >
            Pay Now
          </MobileButton>
        </MobileCard>
      )}

      {repaySuccess && (
        <div
          style={{
            margin: "0 16px 14px",
            background: "#0f2e1a",
            border: "1px solid #14532d",
            borderRadius: "12px",
            padding: "12px",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>
            Payment Successful!
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Your loan repayment has been processed.
          </p>
          <button
            onClick={() => setRepaySuccess(false)}
            style={{
              background: "none",
              border: "none",
              color: "#4ade80",
              fontSize: "11px",
              cursor: "pointer",
              marginTop: "6px",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Make Another Payment
          </button>
        </div>
      )}

      {/* Pending loan notice */}
      {pendingLoan && !activeLoan && (
        <div
          style={{
            margin: "0 16px 14px",
            background: "#1c0a00",
            border: "1px solid #7c2d12",
            borderRadius: "12px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fed7aa" }}>
              Loan Under Review
            </p>
            <p style={{ fontSize: "11px", color: "#fb923c" }}>
              {pendingLoan.loan_ref} · {formatUGX(pendingLoan.amount)} —
              Awaiting approval
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          style={{
            margin: "0 16px 14px",
            background: "#0f2e1a",
            border: "1px solid #14532d",
            borderRadius: "12px",
            padding: "12px",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>
            Loan Request Submitted!
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Your request has been sent for approval. We will notify you via SMS.
          </p>
          <button
            onClick={() => setSuccess(false)}
            style={{
              background: "none",
              border: "none",
              color: "#4ade80",
              fontSize: "11px",
              cursor: "pointer",
              marginTop: "6px",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Submit Another Request
          </button>
        </div>
      )}

      {/* Request Form */}
      {!activeLoan && !pendingLoan && !success && (
        <MobileCard>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: "4px",
            }}
          >
            Request New Loan
          </p>
          <p
            style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}
          >
            Fill in details. Subject to SACCO approval.
          </p>
          {error && (
            <div
              style={{
                background: "#450a0a",
                border: "1px solid #7f1d1d",
                borderRadius: "8px",
                padding: "9px 12px",
                fontSize: "12px",
                color: "#fca5a5",
                marginBottom: "10px",
              }}
            >
              {error}
            </div>
          )}
          <MobileInput
            label="Loan Amount (UGX)"
            type="number"
            placeholder="e.g. 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <MobileSelect
            label="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </MobileSelect>
          <MobileInput
            label="Purpose *"
            type="text"
            placeholder="e.g. Business capital, School fees"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          <MobileTextarea
            label="Reason / Details"
            placeholder="Briefly describe why you need this loan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <MobileButton loading={loading} onClick={handleRequest}>
            Submit Loan Request
          </MobileButton>
        </MobileCard>
      )}

      {/* Loan History */}
      {loans.length > 0 && (
        <>
          <MobileSectionTitle>Loan History</MobileSectionTitle>
          {loans.map((loan) => (
            <MobileCard key={loan.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {formatUGX(loan.amount)}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      fontFamily: "monospace",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    {loan.loan_ref}
                  </p>
                </div>
                <MobileBadge status={loan.status} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <div>
                  <p style={{ fontSize: "9px", color: "#64748b" }}>Balance</p>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {formatUGX(loan.balance)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "9px", color: "#64748b" }}>Monthly</p>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {formatUGX(loan.monthly_payment ?? 0)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "9px", color: "#64748b" }}>Due</p>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {formatDate(loan.due_date)}
                  </p>
                </div>
              </div>
            </MobileCard>
          ))}
        </>
      )}
      <div style={{ height: "16px" }} />
    </div>
  )
}
