"use client"

import { useState } from "react"
import {
  MobileCard,
  MobileInput,
  MobileSelect,
  MobileButton,
} from "../components/mobile-ui"

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString("en-UG")}`
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000]

export function MobileWithdrawClient({
  accounts,
  withdrawableAccounts,
}: {
  accounts: any[]
  withdrawableAccounts: any[]
}) {
  const [selectedId, setSelectedId] = useState(
    withdrawableAccounts[0]?.id ?? ""
  )
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [narration, setNarration] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const account = withdrawableAccounts.find((a) => a.id === selectedId)

  const handleWithdraw = async () => {
    const amtCents = Number(amount) * 100
    if (!amount || amtCents < 100000) {
      setError("Minimum withdrawal is UGX 1,000")
      return
    }
    if (!selectedId) {
      setError("Please select an account")
      return
    }
    if (account && amtCents > account.balance) {
      setError(`Insufficient balance. Available: ${formatUGX(account.balance)}`)
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mobile/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedId,
          amount: amtCents,
          payment_method: method,
          narration,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Withdrawal failed")
        return
      }
      setSuccess(true)
      setAmount("")
      setNarration("")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show locked/fixed account notices
  const lockedAccounts = accounts.filter((a) => a.is_locked)
  const fixedAccounts = accounts.filter((a) => a.account_type === "fixed")

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Fixed account notice */}
      {fixedAccounts.length > 0 && (
        <div
          style={{
            margin: "0 16px 10px",
            background: "#1e1b4b",
            border: "1px solid #312e81",
            borderRadius: "12px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: "12px", color: "#818cf8" }}>
            <strong>Fixed accounts</strong> (
            {fixedAccounts.map((a) => a.account_number).join(", ")}) cannot be
            withdrawn from.
          </p>
        </div>
      )}

      {/* Locked account notice */}
      {lockedAccounts.length > 0 && (
        <div
          style={{
            margin: "0 16px 10px",
            background: "#422006",
            border: "1px solid #7c2d12",
            borderRadius: "12px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: "12px", color: "#fb923c" }}>
            {lockedAccounts.map((a) => a.account_number).join(", ")} locked
            until {lockedAccounts[0]?.lock_until ?? "further notice"}.
          </p>
        </div>
      )}

      {withdrawableAccounts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#475569",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            style={{ margin: "0 auto 12px", display: "block" }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: "14px", fontWeight: 600 }}>
            No withdrawable accounts
          </p>
          <p style={{ fontSize: "12px", marginTop: "4px" }}>
            Fixed and locked accounts cannot be withdrawn from
          </p>
        </div>
      ) : (
        <>
          {/* Balance card */}
          {account && (
            <div
              style={{
                margin: "0 16px 14px",
                background: "#1c0a00",
                border: "1px solid #7c2d12",
                borderRadius: "14px",
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#fb923c",
                  fontWeight: 600,
                  marginBottom: "3px",
                }}
              >
                Available Balance
              </p>
              <p
                style={{ fontSize: "26px", fontWeight: 800, color: "#f1f5f9" }}
              >
                {formatUGX(account.balance)}
              </p>
              <p
                style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}
              >
                {account.account_number} · {account.account_type}
              </p>
            </div>
          )}

          {success && (
            <div
              style={{
                margin: "0 16px 14px",
                background: "#0f2e1a",
                border: "1px solid #14532d",
                borderRadius: "12px",
                padding: "12px 16px",
              }}
            >
              <p
                style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}
              >
                Withdrawal Requested!
              </p>
              <p
                style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}
              >
                Your withdrawal request has been submitted. You will be notified
                when processed.
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
                Another Withdrawal
              </button>
            </div>
          )}

          {!success && (
            <MobileCard>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  marginBottom: "4px",
                }}
              >
                Withdraw Funds
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "14px",
                }}
              >
                Only regular unlocked accounts can be withdrawn.
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

              {withdrawableAccounts.length > 1 && (
                <MobileSelect
                  label="Account"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {withdrawableAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} · {formatUGX(a.balance)}
                    </option>
                  ))}
                </MobileSelect>
              )}

              {/* Quick amounts */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Quick Amounts
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {QUICK_AMOUNTS.filter(
                    (q) => account && q <= account.balance / 100
                  ).map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q / 100))}
                      style={{
                        background:
                          amount === String(q / 100) ? "#f97316" : "#1e293b",
                        border: `1px solid ${amount === String(q / 100) ? "#f97316" : "#334155"}`,
                        borderRadius: "20px",
                        padding: "5px 12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: amount === String(q / 100) ? "#fff" : "#64748b",
                        cursor: "pointer",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      {(q / 100).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <MobileInput
                label="Custom Amount (UGX)"
                type="number"
                placeholder={`Max: ${account ? (account.balance / 100).toLocaleString() : "0"}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <MobileSelect
                label="Withdraw To"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="cash">Collect at Office</option>
                <option value="mobile_money">Mobile Money (Flutterwave)</option>
              </MobileSelect>
              <MobileInput
                label="Narration (optional)"
                type="text"
                placeholder="e.g. Emergency"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
              <MobileButton
                variant="primary"
                loading={loading}
                onClick={handleWithdraw}
              >
                Request Withdrawal
              </MobileButton>
            </MobileCard>
          )}
        </>
      )}
      <div style={{ height: "16px" }} />
    </div>
  )
}
