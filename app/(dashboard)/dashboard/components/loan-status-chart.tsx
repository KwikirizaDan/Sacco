"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { HandCoins } from "lucide-react"

interface LoanStatusData {
  status: string
  count: number
}

// Vivid, distinct, finance-grade palette
const STATUS_META: Record<string, { color: string; label: string }> = {
  pending:   { color: "#f59e0b", label: "Pending" },
  approved:  { color: "#3b82f6", label: "Approved" },
  verified:  { color: "#06b6d4", label: "Verified" },
  active:    { color: "#10b981", label: "Active" },
  disbursed: { color: "#8b5cf6", label: "Disbursed" },
  extended:  { color: "#f97316", label: "Extended" },
  settled:   { color: "#6b7280", label: "Settled" },
  declined:  { color: "#ef4444", label: "Declined" },
  defaulted: { color: "#dc2626", label: "Defaulted" },
}

const fallbackColors = ["#94a3b8", "#64748b", "#475569"]

export function LoanStatusChart({
  loanStatusData,
}: {
  loanStatusData: LoanStatusData[]
}) {
  const total = loanStatusData.reduce((s, d) => s + d.count, 0)

  const enriched = loanStatusData.map((item, i) => ({
    ...item,
    color: STATUS_META[item.status]?.color ?? fallbackColors[i % fallbackColors.length],
    label: STATUS_META[item.status]?.label ?? item.status,
    pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }))

  const chartConfig = enriched.reduce((acc, item) => {
    acc[item.status] = { label: item.label, color: item.color }
    return acc
  }, {} as ChartConfig)

  return (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground uppercase tracking-widest">
              Loan Status
            </p>
            <p className="text-xs text-muted-foreground">Breakdown by current status</p>
          </div>
        </div>
        <div className="bg-muted px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {total} total
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-muted-foreground">No loan data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-4">
          {/* Donut */}
          <div className="relative shrink-0">
            <ChartContainer config={chartConfig} className="h-[180px] w-[180px]">
              <PieChart>
                <Pie
                  data={enriched}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {enriched.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground leading-none">{total}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Loans</span>
            </div>
          </div>

          {/* Side legend table */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {enriched.map((item) => (
              <div key={item.status} className="flex items-center gap-2.5 group">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-muted-foreground capitalize flex-1 truncate group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {item.count}
                </span>
                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}