"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

const data = [
  { month: "Oct", savings: 4200000, loans: 1800000 },
  { month: "Nov", savings: 5800000, loans: 2400000 },
  { month: "Dec", savings: 5200000, loans: 3100000 },
  { month: "Jan", savings: 7100000, loans: 2800000 },
  { month: "Feb", savings: 8400000, loans: 3600000 },
  { month: "Mar", savings: 9200000, loans: 4200000 },
]

const SAVINGS_COLOR = "#10b981"  // emerald
const LOANS_COLOR   = "#6366f1"  // indigo

const chartConfig = {
  savings: { label: "Savings", color: SAVINGS_COLOR },
  loans:   { label: "Loans",   color: LOANS_COLOR   },
} satisfies ChartConfig

// Compute deltas
const last    = data[data.length - 1]
const prev    = data[data.length - 2]
const sDelta  = (((last.savings - prev.savings) / prev.savings) * 100).toFixed(1)
const lDelta  = (((last.loans   - prev.loans)   / prev.loans)   * 100).toFixed(1)
const sPct    = Number(sDelta)
const lPct    = Number(lDelta)

function formatM(v: number) {
  return `${(v / 1_000_000).toFixed(1)}M`
}

export function SavingsLoanChart() {
  return (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground uppercase tracking-widest">
              Savings vs Loans
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last 6 months overview · UGX
            </p>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-2">
            {/* Savings chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ borderColor: `${SAVINGS_COLOR}30`, background: `${SAVINGS_COLOR}10` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SAVINGS_COLOR }} />
              <span className="text-[11px] font-semibold" style={{ color: SAVINGS_COLOR }}>
                UGX {formatM(last.savings)}
              </span>
              {sPct >= 0
                ? <TrendingUp className="h-3 w-3" style={{ color: SAVINGS_COLOR }} />
                : <TrendingDown className="h-3 w-3" style={{ color: SAVINGS_COLOR }} />}
              <span className="text-[10px] font-medium" style={{ color: SAVINGS_COLOR }}>
                {sPct >= 0 ? "+" : ""}{sDelta}%
              </span>
            </div>

            {/* Loans chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border"
              style={{ borderColor: `${LOANS_COLOR}30`, background: `${LOANS_COLOR}10` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: LOANS_COLOR }} />
              <span className="text-[11px] font-semibold" style={{ color: LOANS_COLOR }}>
                UGX {formatM(last.loans)}
              </span>
              {lPct >= 0
                ? <TrendingUp className="h-3 w-3" style={{ color: LOANS_COLOR }} />
                : <TrendingDown className="h-3 w-3" style={{ color: LOANS_COLOR }} />}
              <span className="text-[10px] font-medium" style={{ color: LOANS_COLOR }}>
                {lPct >= 0 ? "+" : ""}{lDelta}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-3 pb-2">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              {/* Savings gradient — emerald */}
              <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={SAVINGS_COLOR} stopOpacity={0.5} />
                <stop offset="60%"  stopColor={SAVINGS_COLOR} stopOpacity={0.1} />
                <stop offset="100%" stopColor={SAVINGS_COLOR} stopOpacity={0} />
              </linearGradient>
              {/* Loans gradient — indigo */}
              <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={LOANS_COLOR} stopOpacity={0.45} />
                <stop offset="60%"  stopColor={LOANS_COLOR} stopOpacity={0.08} />
                <stop offset="100%" stopColor={LOANS_COLOR} stopOpacity={0} />
              </linearGradient>

              {/* Glow filters for active dots */}
              <filter id="sGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="lGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" opacity={0.6} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              width={38}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 2" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => `UGX ${Number(value).toLocaleString()}`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />

            {/* Savings */}
            <Area
              type="monotone"
              dataKey="savings"
              stroke={SAVINGS_COLOR}
              strokeWidth={2.5}
              fill="url(#savGrad)"
              dot={{ r: 3.5, fill: SAVINGS_COLOR, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: SAVINGS_COLOR, stroke: "hsl(var(--card))", strokeWidth: 2, filter: "url(#sGlow)" }}
            />

            {/* Loans */}
            <Area
              type="monotone"
              dataKey="loans"
              stroke={LOANS_COLOR}
              strokeWidth={2.5}
              fill="url(#loanGrad)"
              dot={{ r: 3.5, fill: LOANS_COLOR, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: LOANS_COLOR, stroke: "hsl(var(--card))", strokeWidth: 2, filter: "url(#lGlow)" }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}