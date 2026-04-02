// app/(dashboard)/loans/[id]/page.tsx
import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getLoanById } from "@/db/queries/loans"
import { getAllMembers } from "@/db/queries/members"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { formatLoanSchedule } from "@/lib/pdf/loan-calculator"
import {
  Banknote,
  Calendar,
  Clock,
  User,
  AlertCircle,
  ArrowLeft,
  FileText,
  TrendingUp,
  CreditCard,
  Phone,
  Mail,
} from "lucide-react"

interface LoanDetailPageProps {
  params: Promise<{ id: string }>
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  disbursed: "default",
  active: "default",
  settled: "outline",
  declined: "destructive",
  defaulted: "destructive",
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm p-6">Loading loan details…</div>}>
      <LoanDetailContent id={id} />
    </Suspense>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  aside,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </div>
  )
}

// ── Info row ─────────────────────────────────────────────────────────────────

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  )
}

function InfoItem({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: React.ReactNode
  accent?: "green" | "orange" | "red" | "blue"
  mono?: boolean
}) {
  const valueColor =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "orange"
        ? "text-orange-500 dark:text-orange-400"
        : accent === "red"
          ? "text-red-500 dark:text-red-400"
          : accent === "blue"
            ? "text-blue-600 dark:text-blue-400"
            : "text-foreground"

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${valueColor} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}

// ── Payment tile ─────────────────────────────────────────────────────────────

function PaymentTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: "blue" | "green" | "orange"
}) {
  const ring =
    accent === "blue"
      ? "border-blue-200 dark:border-blue-800"
      : accent === "green"
        ? "border-green-200 dark:border-green-800"
        : "border-orange-200 dark:border-orange-800"

  const text =
    accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "green"
        ? "text-green-600 dark:text-green-400"
        : "text-orange-500 dark:text-orange-400"

  return (
    <div
      className={`rounded-xl border ${ring} bg-background px-4 py-3 flex flex-col gap-1`}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
    </div>
  )
}

// ── Main content ─────────────────────────────────────────────────────────────

async function LoanDetailContent({ id }: { id: string }) {
  const loan = await getLoanById(id)
  if (!loan) notFound()

  const members = await getAllMembers()
  const member = members.find((m) => m.id === loan.member_id)

  const loanWithMember = {
    ...loan,
    member_name: member?.full_name ?? "Unknown",
    member_code: member?.member_code ?? "N/A",
    member_phone: member?.phone,
    member_email: member?.email,
  }

  const schedule =
    loan.duration_months && loan.monthly_payment && loan.created_at
      ? formatLoanSchedule(
          loan.expected_received,
          loan.duration_months,
          new Date(loan.created_at)
        )
      : []

  const repaidAmount = loan.expected_received - loan.balance
  const progress = Math.min(
    100,
    Math.round((repaidAmount / loan.expected_received) * 100)
  )

  const timelineEvents = [
    { label: "Applied", date: loan.created_at, color: "bg-yellow-400" },
    { label: "Disbursed", date: loan.disbursed_at, color: "bg-purple-500" },
    { label: "Settled", date: loan.settled_at, color: "bg-green-500" },
  ].filter((e) => e.date)

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link href="/loans">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Loans
            </button>
          </Link>
        </div>
        <Link href={`/loans/${id}/contract`}>
          <Button variant="outline" size="sm" className="rounded-lg gap-2">
            <FileText className="h-4 w-4" />
            View Contract
          </Button>
        </Link>
      </div>

      {/* ── Loan ref + status bar ── */}
      <div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Loan Reference
          </p>
          <h1 className="text-xl font-bold font-mono text-foreground">
            {loan.loan_ref}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={statusVariant[loan.status] ?? "outline"} className="capitalize text-sm px-3 py-1">
            {loan.status}
          </Badge>

          {loan.status === "active" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                Repaid
              </span>
              <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Decline reason ── */}
      {loan.decline_reason && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Decline Reason
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loan.decline_reason}
            </p>
          </div>
        </div>
      )}

      {/* ── Two-column: Borrower + Loan Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Borrower */}
        <Section icon={User} title="Borrower">
          <InfoGrid>
            <InfoItem label="Full Name" value={loanWithMember.member_name} />
            <InfoItem label="Member Code" value={loanWithMember.member_code} mono />
            <InfoItem label="Phone" value={loanWithMember.member_phone ?? "—"} />
            <InfoItem label="Email" value={loanWithMember.member_email ?? "—"} />
          </InfoGrid>
        </Section>

        {/* Loan Summary */}
        <Section icon={Banknote} title="Loan Summary">
          <InfoGrid>
            <InfoItem label="Principal" value={formatUGX(loan.amount)} />
            <InfoItem
              label="Total to Receive"
              value={formatUGX(loan.expected_received)}
              accent="green"
            />
            <InfoItem
              label="Balance Remaining"
              value={formatUGX(loan.balance)}
              accent="orange"
            />
            <InfoItem
              label="Interest Rate"
              value={`${loan.interest_rate}% · ${loan.interest_type}`}
              accent="blue"
            />
            <InfoItem
              label="Duration"
              value={`${loan.duration_months} months`}
            />
            <InfoItem label="Due Date" value={formatDate(loan.due_date)} />
            {(loan.late_penalty_fee ?? 0) > 0 && (
              <InfoItem
                label="Late Penalty"
                value={formatUGX(loan.late_penalty_fee ?? 0)}
                accent="red"
              />
            )}
          </InfoGrid>
        </Section>
      </div>

      {/* ── Payment Schedule ── */}
      <Section icon={Calendar} title="Payment Schedule">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <PaymentTile
            label="Daily Payment"
            value={formatUGX(loan.daily_payment ?? 0)}
            accent="blue"
          />
          <PaymentTile
            label="Monthly Payment"
            value={formatUGX(loan.monthly_payment ?? 0)}
            accent="green"
          />
          <PaymentTile
            label="Late Penalty"
            value={formatUGX(loan.late_penalty_fee ?? 0)}
            accent="orange"
          />
        </div>

        {schedule.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">#</TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Payment</TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.installment} className="text-sm">
                      <TableCell className="text-muted-foreground">
                        {row.installment}
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">
                        {formatUGX(row.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatUGX(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Section>

      {/* ── Notes ── */}
      {loan.notes && (
        <div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Notes
          </p>
          <p className="text-sm text-foreground leading-relaxed">{loan.notes}</p>
        </div>
      )}

      {/* ── Timeline ── */}
      {timelineEvents.length > 0 && (
        <Section icon={Clock} title="Timeline">
          <div className="relative pl-4">
            {/* vertical connector */}
            {timelineEvents.length > 1 && (
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
            )}
            <div className="space-y-4">
              {timelineEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  <div
                    className={`h-3 w-3 rounded-full ${event.color} shrink-0 ring-2 ring-background`}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {event.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}