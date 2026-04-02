import { Badge } from "@/components/ui/badge"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { ArrowDownLeft, ArrowUpRight, Minus, Receipt } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  narration: string | null
  created_at: Date | null
}

const TYPE_META: Record<
  string,
  {
    label: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    amountColor: string
    sign: "+" | "-" | ""
    badgeStyle: string
  }
> = {
  savings_deposit: {
    label: "Savings Deposit",
    icon: ArrowDownLeft,
    iconBg: "#10b98115",
    iconColor: "#10b981",
    amountColor: "#10b981",
    sign: "+",
    badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  savings_withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    iconBg: "#ef444415",
    iconColor: "#ef4444",
    amountColor: "#ef4444",
    sign: "-",
    badgeStyle: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  loan_disbursement: {
    label: "Loan Disbursed",
    icon: ArrowUpRight,
    iconBg: "#f9731615",
    iconColor: "#f97316",
    amountColor: "#f97316",
    sign: "-",
    badgeStyle: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  loan_repayment: {
    label: "Loan Repayment",
    icon: ArrowDownLeft,
    iconBg: "#6366f115",
    iconColor: "#6366f1",
    amountColor: "#6366f1",
    sign: "+",
    badgeStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  fine_payment: {
    label: "Fine Payment",
    icon: Minus,
    iconBg: "#eab30815",
    iconColor: "#eab308",
    amountColor: "#eab308",
    sign: "-",
    badgeStyle: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
}

const FALLBACK = {
  label: "",
  icon: Minus,
  iconBg: "hsl(var(--muted))",
  iconColor: "hsl(var(--muted-foreground))",
  amountColor: "hsl(var(--foreground))",
  sign: "" as const,
  badgeStyle: "bg-muted text-muted-foreground border-border",
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground uppercase tracking-widest">
              Recent Transactions
            </p>
            <p className="text-xs text-muted-foreground">Latest financial activity</p>
          </div>
        </div>
        {transactions.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {transactions.length} entries
          </span>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Receipt className="h-5 w-5 opacity-30" />
          </div>
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {transactions.map((tx) => {
            const meta = TYPE_META[tx.type] ?? { ...FALLBACK, label: tx.type }
            const Icon = meta.icon

            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors group relative"
              >
                {/* Left color bar */}
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: meta.iconColor }}
                />

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: meta.iconBg }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.iconColor }} />
                </div>

                {/* Description + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-snug">
                    {tx.narration ?? meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {formatDate(tx.created_at)}
                  </p>
                </div>

                {/* Badge */}
                <div className="hidden sm:block shrink-0">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeStyle}`}
                  >
                    {meta.label || tx.type.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0 min-w-[90px]">
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{ color: meta.amountColor }}
                  >
                    {meta.sign}{formatUGX(tx.amount)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}