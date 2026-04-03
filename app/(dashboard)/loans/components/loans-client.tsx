// app/(dashboard)/loans/components/loans-client.tsx
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Banknote,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  Percent,
  HandCoins,
} from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { LoansTable } from "./loans-table"
import { DonutChart } from "@/app/(dashboard)/components/donut-chart"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import Link from "next/link"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface LoansClientProps {
  loans: any[]
  members: any[]
  stats: {
    totalDisbursed: number
    totalLoans: number
    activeLoans: number
    pendingLoans: number
    settledLoans: number
    outstandingBalance: number
  }
  interestRates: any[]
}

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#3b82f6",
  disbursed: "#8b5cf6",
  active: "#10b981",
  settled: "#6b7280",
  declined: "#ef4444",
  defaulted: "#dc2626",
  extended: "#f97316",
  verified: "#06b6d4",
}

// Consistent color palette matching dashboard line graph
const CHART_COLORS = {
  amount: "#6366f1",   // indigo - matching loans color
  balance: "#10b981", // emerald - matching savings color  
}

const chartConfig: ChartConfig = {
  amount: { label: "Amount", color: CHART_COLORS.amount },
  balance: { label: "Balance", color: CHART_COLORS.balance },
}

export function LoansClient({ loans, members, stats, interestRates }: LoansClientProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      const matchSearch =
        l.loan_ref?.toLowerCase().includes(search.toLowerCase()) ||
        l.member_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.member_code?.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === "all" || l.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [loans, search, statusFilter])

  // Chart data — loans by status
  const statusChartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    loans.forEach((l) => {
      grouped[l.status] = (grouped[l.status] || 0) + 1
    })
    return Object.entries(grouped).map(([status, count]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] ?? "#6b7280",
    }))
  }, [loans])

  // Chart data — monthly disbursements (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { amount: number; balance: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString("default", { month: "short" })
      months[key] = { amount: 0, balance: 0 }
    }
    loans.forEach((l) => {
      if (!l.created_at) return
      const d = new Date(l.created_at)
      const key = d.toLocaleString("default", { month: "short" })
      if (months[key]) {
        months[key].amount += l.amount / 100
        months[key].balance += l.balance / 100
      }
    })
    return Object.entries(months).map(([month, v]) => ({
      month,
      amount: v.amount,
      balance: v.balance,
    }))
  }, [loans])

  const handleExport = () => {
    const data = filtered.map((l) => ({
      "Loan Ref": l.loan_ref,
      Member: l.member_name,
      "Member Code": l.member_code,
      "Amount (UGX)": l.amount / 100,
      "Expected Received (UGX)": l.expected_received / 100,
      "Balance (UGX)": l.balance / 100,
      "Interest Rate": l.interest_rate,
      "Interest Type": l.interest_type,
      "Duration (Months)": l.duration_months,
      "Daily Payment": l.daily_payment / 100,
      "Monthly Payment": l.monthly_payment / 100,
      "Late Penalty Fee": l.late_penalty_fee / 100,
      Status: l.status,
      "Due Date": l.due_date ?? "",
      "Created At": l.created_at
        ? new Date(l.created_at).toLocaleDateString()
        : "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Loans")
    XLSX.writeFile(wb, "sacco-loans.xlsx")
    toast.success("Loans exported to Excel")
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.totalLoans} total loans · {interestRates.length} active interest rates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/loans/interest-rates">
            <Button variant="outline" size="lg"  className="whitespace-nowrap">
              <Percent className="h-4 w-4 mr-2" />
              Interest Rates
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={handleExport} className="whitespace-nowrap">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/loans/new">
            <Button size="lg" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Total Disbursed", value: formatUGX(stats.totalDisbursed), description: "Total loan amount", icon: Banknote, accentColor: "#10b981" },
          { title: "Outstanding", value: formatUGX(stats.outstandingBalance), description: "Remaining balance", icon: TrendingUp, accentColor: "#f97316" },
          { title: "Active Loans", value: stats.activeLoans, description: "Currently active", icon: CheckCircle, accentColor: "#3b82f6" },
          { title: "Pending", value: stats.pendingLoans, description: "Awaiting approval", icon: Clock, accentColor: "#eab308" },
          { title: "Settled", value: stats.settledLoans, description: "Fully paid", icon: CheckCircle, accentColor: "#6b7280" },
          { title: "Total Loans", value: stats.totalLoans, description: "All time loans", icon: Banknote, accentColor: "#a855f7" },
        ].map((card, i) => (
          <div
            key={card.title}
            className="relative bg-card border border-border rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            {/* Left accent bar */}

            {/* Subtle tinted background on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ background: `radial-gradient(ellipse at top left, ${card.accentColor}08, transparent 70%)` }}
            />

            <div className="relative px-5 pt-4 pb-4">
              {/* Top row: title + icon */}
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none">
                  {card.title}
                </p>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${card.accentColor}18` }}
                >
                  <card.icon
                    className="h-4 w-4"
                    style={{ color: card.accentColor }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className="text-[1.6rem] font-bold text-foreground tracking-tight leading-none mb-3 tabular-nums">
                {card.value}
              </p>

              {/* Description */}
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-3 right-3 h-px opacity-20"
              style={{ background: `linear-gradient(to right, transparent, ${card.accentColor}, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Disbursements</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="h-[220px] w-full min-w-0">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `UGX ${Number(v).toLocaleString()}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="amount" fill={CHART_COLORS.amount} radius={4} name="Amount" />
                <Bar dataKey="balance" fill={CHART_COLORS.balance} radius={4} name="Balance" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <DonutChart
          data={statusChartData}
          totalLabel="Loans"
          title="Loans by Status"
          subtitle="Breakdown by current status"
          icon={<HandCoins className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ref, member..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <LoansTable loans={filtered} />
    </div>
  )
}