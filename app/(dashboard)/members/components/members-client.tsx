"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Download,
  Upload,
  UserPlus,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { Member } from "@/db/schema"
import { MembersTable } from "./members-table"
import { MembersGrid } from "./members-grid"
import { ImportExcel } from "./import-excel"
import * as XLSX from "xlsx"
import { toast } from "sonner"

interface MembersClientProps {
  members: Member[]
}

export function MembersClient({ members }: MembersClientProps) {
  const router = useRouter()
  const [view, setView] = useState<"table" | "grid">("table")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showImport, setShowImport] = useState(false)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.member_code.toLowerCase().includes(search.toLowerCase()) ||
        (m.phone ?? "").toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === "all" || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [members, search, statusFilter])

  const handleExport = () => {
    const data = filtered.map((m) => ({
      "Member Code": m.member_code,
      "Full Name": m.full_name,
      Email: m.email ?? "",
      Phone: m.phone ?? "",
      "National ID": m.national_id ?? "",
      Status: m.status,
      "Date of Birth": m.date_of_birth ?? "",
      Address: m.address ?? "",
      "Next of Kin": m.next_of_kin ?? "",
      "Next of Kin Phone": m.next_of_kin_phone ?? "",
      "Joined At": m.joined_at
        ? new Date(m.joined_at).toLocaleDateString()
        : "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Members")
    XLSX.writeFile(wb, "sacco-members.xlsx")
    toast.success("Members exported to Excel")
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {members.length} total members
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="lg" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button size="lg"onClick={() => router.push("/members/add")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Left — View Toggle */}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "grid")}
        >
          <TabsList>
            <TabsTrigger value="table">
              <List className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right — Search + Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, code, phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "table" ? (
        <MembersTable members={filtered} />
      ) : (
        <MembersGrid members={filtered} />
      )}

      {/* Import Modal */}
      <ImportExcel
        open={showImport}
        onClose={() => setShowImport(false)}
      />
    </div>
  )
}