"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"

interface DonutChartData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  totalLabel?: string
  totalValue?: number
  title?: string
  subtitle?: string
  icon?: React.ReactNode
}

const fallbackColors = ["#94a3b8", "#64748b", "#475569"]

export function DonutChart({
  data,
  totalLabel = "Total",
  totalValue,
  title,
  subtitle,
  icon,
}: DonutChartProps) {
  const total = totalValue ?? data.reduce((s, d) => s + d.value, 0)

  const enriched = data.map((item, i) => ({
    ...item,
    pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))

  const chartConfig = enriched.reduce((acc, item) => {
    acc[item.label] = { label: item.label, color: item.color }
    return acc
  }, {} as ChartConfig)

  return (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <p className="text-sm font-semibold text-foreground uppercase tracking-widest">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="bg-muted px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {total} {totalLabel}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-4">
          {/* Donut */}
          <div className="relative shrink-0">
            <ChartContainer config={chartConfig} className="h-[180px] w-[180px]">
              <PieChart>
                <Pie
                  data={enriched}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {enriched.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color || fallbackColors[i % fallbackColors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground leading-none">{total}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                {totalLabel}
              </span>
            </div>
          </div>

          {/* Side legend table */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {enriched.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 group">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-muted-foreground capitalize flex-1 truncate group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {item.value}
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