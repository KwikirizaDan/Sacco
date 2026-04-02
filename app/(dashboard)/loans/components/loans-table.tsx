// app/(dashboard)/loans/components/loans-table.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  ArrowUpDown,
  Banknote,
  Trash2,
  FileText,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { approveLoanAction, disburseLoanAction, deleteLoanAction } from "../actions"
import { RepayDialog } from "./repay-dialog"
import { DeclineDialog } from "./decline-dialog"
import { LoanPdfButton } from "./loan-pdf-button"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  disbursed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  settled: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  defaulted: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300",
  extended: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
}

export function LoansTable({ loans }: { loans: any[] }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [repayLoan, setRepayLoan] = useState<any>(null)
  const [declineLoan, setDeclineLoan] = useState<any>(null)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "loan_ref",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-semibold hover:bg-transparent"
        >
          Loan Ref
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.loan_ref}</span>
      ),
    },
    {
      accessorKey: "member_name",
      header: "Member",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.member_name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.member_code}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatUGX(row.original.amount),
    },
    {
      accessorKey: "expected_received",
      header: "Expected to Receive",
      cell: ({ row }) => formatUGX(row.original.expected_received),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => formatUGX(row.original.balance),
    },
    {
      accessorKey: "monthly_payment",
      header: "Monthly",
      cell: ({ row }) => formatUGX(row.original.monthly_payment ?? 0),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[row.original.status] ?? ""
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      accessorKey: "created_at",
      header: "Applied",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const loan = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/loans/${loan.id}`)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details / Timesheet
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/loans/${loan.id}/contract`)
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Contract
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {loan.status === "pending" && (
                <>
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation()
                      const res = await approveLoanAction(loan.id)
                      if (res.success) toast.success("Loan approved")
                      else toast.error(res.error)
                    }}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Loan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeclineLoan(loan)
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline Loan
                  </DropdownMenuItem>
                </>
              )}

              {loan.status === "approved" && (
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation()
                    const res = await disburseLoanAction(loan.id)
                    if (res.success) toast.success("Loan disbursed")
                    else toast.error(res.error)
                  }}
                  className="text-purple-600"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Disburse Loan
                </DropdownMenuItem>
              )}

              {(loan.status === "active" || loan.status === "disbursed") && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setRepayLoan(loan)
                  }}
                  className="text-blue-600"
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Record Repayment
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <LoanPdfButton loan={loan} />

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (confirm("Are you sure you want to delete this loan?")) {
                    const res = await deleteLoanAction(loan.id)
                    if (res.success) toast.success("Loan deleted")
                    else toast.error(res.error)
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Loan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: loans,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg">
        <Banknote className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">No loans found</p>
        <p className="text-sm mt-1">Add your first loan to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/loans/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {/* Dialogs */}
      {repayLoan && (
        <RepayDialog
          loan={repayLoan}
          open={!!repayLoan}
          onClose={() => setRepayLoan(null)}
        />
      )}
      {declineLoan && (
        <DeclineDialog
          loan={declineLoan}
          open={!!declineLoan}
          onClose={() => setDeclineLoan(null)}
        />
      )}
    </div>
  )
}
