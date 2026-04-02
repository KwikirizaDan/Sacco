"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FileText,
  Files,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { UploadDialog } from "./upload-dialog"
import { DocumentCard } from "./document-card"
import { DocumentsTable } from "./documents-table"

const typeLabels: Record<string, string> = {
  national_id: "National ID",
  registration_form: "Registration Form",
  loan_contract: "Loan Contract",
  membership_certificate: "Membership Certificate",
  other: "Other",
}

const typeColors: Record<string, string> = {
  national_id: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  registration_form: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  loan_contract: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  membership_certificate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

interface DocumentsClientProps {
  documents: any[]
  members: any[]
}

export { typeLabels, typeColors }

export function DocumentsClient({ documents, members }: DocumentsClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [view, setView] = useState<"grid" | "table">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch =
        d.member_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.member_code?.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || d.type === typeFilter
      return matchSearch && matchType
    })
  }, [documents, search, typeFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filtered.slice(startIndex, startIndex + pageSize)
  }, [filtered, currentPage, pageSize])

  // Stats per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    documents.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1
    })
    return counts
  }, [documents])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {documents.length} documents stored
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Type Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(typeLabels).map(([type, label]) => (
          <div
            key={type}
            className={`relative bg-card border border-border rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer ${typeFilter === type ? "ring-2 ring-primary" : ""}`}
            onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
              style={{ background: typeColors[type].split(" ")[1] === "text-blue-700" ? "#3b82f6" : typeColors[type].split(" ")[1] === "text-green-700" ? "#10b981" : typeColors[type].split(" ")[1] === "text-orange-700" ? "#f97316" : typeColors[type].split(" ")[1] === "text-purple-700" ? "#a855f7" : "#6b7280" }}
            />

            {/* Subtle tinted background on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ background: `radial-gradient(ellipse at top left, ${typeColors[type].split(" ")[1] === "text-blue-700" ? "#3b82f6" : typeColors[type].split(" ")[1] === "text-green-700" ? "#10b981" : typeColors[type].split(" ")[1] === "text-orange-700" ? "#f97316" : typeColors[type].split(" ")[1] === "text-purple-700" ? "#a855f7" : "#6b7280"}08, transparent 70%)` }}
            />

            <div className="relative px-5 pt-4 pb-4">
              {/* Top row: title + icon */}
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none">
                  {label}
                </p>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${typeColors[type].split(" ")[1] === "text-blue-700" ? "#3b82f6" : typeColors[type].split(" ")[1] === "text-green-700" ? "#10b981" : typeColors[type].split(" ")[1] === "text-orange-700" ? "#f97316" : typeColors[type].split(" ")[1] === "text-purple-700" ? "#a855f7" : "#6b7280"}18` }}
                >
                  <FileText
                    className="h-4 w-4"
                    style={{ color: typeColors[type].split(" ")[1] === "text-blue-700" ? "#3b82f6" : typeColors[type].split(" ")[1] === "text-green-700" ? "#10b981" : typeColors[type].split(" ")[1] === "text-orange-700" ? "#f97316" : typeColors[type].split(" ")[1] === "text-purple-700" ? "#a855f7" : "#6b7280" }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className="text-[1.6rem] font-bold text-foreground tracking-tight leading-none mb-3 tabular-nums">
                {typeCounts[type] ?? 0}
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-3 right-3 h-px opacity-20"
              style={{ background: `linear-gradient(to right, transparent, ${typeColors[type].split(" ")[1] === "text-blue-700" ? "#3b82f6" : typeColors[type].split(" ")[1] === "text-green-700" ? "#10b981" : typeColors[type].split(" ")[1] === "text-orange-700" ? "#f97316" : typeColors[type].split(" ")[1] === "text-purple-700" ? "#a855f7" : "#6b7280"}, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Left — View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "table")}>
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table">
              <List className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right — Search + Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member, file..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg">
          <Files className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">No documents found</p>
          <p className="text-sm mt-1">Upload your first document to get started</p>
          <Button className="mt-4" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>

          {/* Pagination for Grid View */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> documents
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Table View */}
      {view === "table" && filtered.length > 0 && (
        <DocumentsTable documents={filtered} />
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        members={members}
      />
    </div>
  )
}