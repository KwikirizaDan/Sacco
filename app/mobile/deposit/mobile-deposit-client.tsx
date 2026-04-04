"use client"

import { useState, useEffect } from "react"
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

declare global {
  interface Window {
    FlutterwaveCheckout: any
  }
}

export function MobileDepositClient({ accounts }: { accounts: any[] }) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [narration, setNarration] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const account = accounts.find((a) => a.id === selectedAccount)

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

  const handleDeposit = async () => {
    if (!amount || Number(amount) < 1000) {
      setError("Minimum deposit is UGX 1,000")
      return
    }
    if (!selectedAccount) {
      setError("Please select a savings account")
      return
    }
    if (account?.is_locked) {
      setError("This account is locked and cannot accept deposits")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mobile/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccount,
          amount: Number(amount) * 100,
          payment_method: method,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Deposit failed")
        setLoading(false)
        return
      }

      if (
        method === "mobile_money" &&
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
            title: "SACCO Deposit",
            description: "Savings deposit",
          },
          callback: async (response: any) => {
            if (response.status === "successful" || response.tx_ref) {
              await finalizeDeposit(
                selectedAccount,
                Number(amount) * 100,
                data.txRef
              )
            } else {
              setError("Payment not completed")
            }
            setLoading(false)
          },
          onclose: () => {
            setLoading(false)
          },
        })
      } else {
        await finalizeDeposit(selectedAccount, Number(amount) * 100, data.txRef)
      }
    } catch {
      setError("Network error. Try again.")
      setLoading(false)
    }
  }

  const finalizeDeposit = async (
    accountId: string,
    amountCents: number,
    txRef: string
  ) => {
    setLoading(true)
    try {
      const res = await fetch("/api/mobile/deposit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          amount: amountCents,
          tx_ref: txRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Deposit confirmation failed")
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

  if (accounts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#475569",
          fontFamily: "Poppins, sans-serif",
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
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <p style={{ fontSize: "14px", fontWeight: 600 }}>
          No savings account found
        </p>
        <p style={{ fontSize: "12px", marginTop: "4px" }}>
          Contact your SACCO admin to open an account
        </p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {account && (
        <div
          style={{
            margin: "0 16px 14px",
            background: "#0f2e1a",
            border: "1px solid #14532d",
            borderRadius: "14px",
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "#4ade80",
              fontWeight: 600,
              marginBottom: "3px",
            }}
          >
            Current Balance
          </p>
          <p style={{ fontSize: "26px", fontWeight: 800, color: "#f1f5f9" }}>
            {formatUGX(account.balance)}
          </p>
          <p style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
            {account.account_number} · {account.account_type}{" "}
            {account.category_name ? `· ${account.category_name}` : ""}
          </p>
          {account.is_locked && (
            <div
              style={{
                marginTop: "8px",
                background: "#422006",
                borderRadius: "8px",
                padding: "6px 10px",
              }}
            >
              <p
                style={{ fontSize: "11px", color: "#fb923c", fontWeight: 600 }}
              >
                Account Locked until {account.lock_until ?? "further notice"}
              </p>
            </div>
          )}
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
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80" }}>
            Deposit Recorded!
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Your deposit has been processed. Balance will update shortly.
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
            Make Another Deposit
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
            Make a Deposit
          </p>
          <p
            style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}
          >
            Funds reflect after confirmation.
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

          {accounts.length > 1 && (
            <MobileSelect
              label="Savings Account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_number} · {formatUGX(a.balance)}{" "}
                  {a.is_locked ? "(Locked)" : ""}
                </option>
              ))}
            </MobileSelect>
          )}

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
              {QUICK_AMOUNTS.map((q) => (
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
            placeholder="e.g. 150000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <MobileSelect
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="cash">Cash at Office</option>
            <option value="mobile_money">Mobile Money (Flutterwave)</option>
          </MobileSelect>
          <MobileInput
            label="Narration (optional)"
            type="text"
            placeholder="e.g. Monthly savings"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />

          <MobileButton
            variant="success"
            loading={loading}
            onClick={handleDeposit}
            disabled={
              account?.is_locked || (!scriptLoaded && method === "mobile_money")
            }
          >
            {account?.is_locked ? "Account Locked" : "Deposit Now"}
          </MobileButton>
        </MobileCard>
      )}
      <div style={{ height: "16px" }} />
    </div>
  )
}
