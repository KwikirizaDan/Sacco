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
import {
  PiggyBank,
  Lock,
  Unlock,
  TrendingUp,
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
} from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { SavingsTable } from "./savings-table"
import { CreateAccountDialog } from "./create-account-dialog"
import * as XLSX from "xlsx"
import { toast } from "sonner"

interface SavingsClientProps {
  accounts: any[]
  stats: {
    totalBalance: number
    totalAccounts: number
    lockedAccounts: number
    regularAccounts: number
    fixedAccounts: number
    avgBalance: number
  }
  members: any[]
  categories: any[]
  activeLoans: any[]
}

const chartConfig: ChartConfig = {
  balance: { label: "Balance", color: "hsl(var(--chart-1))" },
}

export function SavingsClient({
  accounts,
  stats,
  members,
  categories,
  activeLoans,
}: SavingsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>("all")
  const [lockFilter, setLockFilter] = useState<string | null>("all")

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch =
        a.member_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.account_number?.toLowerCase().includes(search.toLowerCase()) ||
        a.member_code?.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || a.account_type === typeFilter
      const matchLock =
        lockFilter === "all" ||
        (lockFilter === "locked" ? a.is_locked : !a.is_locked)
      return matchSearch && matchType && matchLock
    })
  }, [accounts, search, typeFilter, lockFilter])

  // Top 8 savers for chart
  const topSaversData = useMemo(() => {
    return [...accounts]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 8)
      .map((a) => ({
        name: a.member_name?.split(" ")[0] ?? "—",
        balance: a.balance / 100,
      }))
  }, [accounts])

  // Account type pie
  const typeData = [
    { name: "Regular", value: stats.regularAccounts, fill: "hsl(var(--chart-1))" },
    { name: "Fixed", value: stats.fixedAccounts, fill: "hsl(var(--chart-2))" },
  ]

  const handleExport = () => {
    const data = filtered.map((a) => ({
      "Account No": a.account_number,
      Member: a.member_name,
      "Member Code": a.member_code,
      "Balance (UGX)": a.balance / 100,
      Type: a.account_type,
      Status: a.is_locked ? "Locked" : "Active",
      "Lock Until": a.lock_until ?? "",
      Category: a.category_name ?? "",
      Opened: a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Savings")
    XLSX.writeFile(wb, "sacco-savings.xlsx")
    toast.success("Savings exported to Excel")
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.totalAccounts} savings accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: "Total Savings", value: formatUGX(stats.totalBalance), description: "All accounts", icon: PiggyBank, accentColor: "#10b981" },
          { title: "Total Accounts", value: stats.totalAccounts, description: "Savings accounts", icon: Users, accentColor: "#3b82f6" },
          { title: "Average Balance", value: formatUGX(stats.avgBalance), description: "Per account", icon: TrendingUp, accentColor: "#a855f7" },
          { title: "Locked", value: stats.lockedAccounts, description: "Locked accounts", icon: Lock, accentColor: "#f97316" },
          { title: "Regular", value: stats.regularAccounts, description: "Active accounts", icon: Unlock, accentColor: "#14b8a6" },
          { title: "Fixed", value: stats.fixedAccounts, description: "Fixed deposits", icon: PiggyBank, accentColor: "#eab308" },
        ].map((card, i) => (
          <div
            key={card.title}
            className="relative bg-card border border-border rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
              style={{ background: card.accentColor }}
            />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Savers</CardTitle>
          </CardHeader>
          <CardContent>
            {topSaversData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={topSaversData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    width={60}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => `UGX ${Number(v).toLocaleString()}`}
                      />
                    }
                  />
                  <Bar
                    dataKey="balance"
                    fill="hsl(var(--chart-1))"
                    radius={4}
                    name="Balance"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Types</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalAccounts === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ChartContainer config={{}} className="h-[220px] w-full">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member, account number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lockFilter} onValueChange={setLockFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <SavingsTable
        accounts={filtered}
        activeLoans={activeLoans}
      />

      {/* Create Account Dialog */}
      <CreateAccountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        categories={categories}
      />
    </div>
  )
}