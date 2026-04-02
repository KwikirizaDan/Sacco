"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
  Flag,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  updateMemberStatusAction,
  sendMemberSmsAction,
  assignLoanAction,
  addSavingsAction,
} from "../actions"
import { addFineAction } from "../../fines/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Member, Loan, SavingsAccount, Fine, Transaction } from "@/db/schema"

interface MemberProfileProps {
  member: Member
  loans: Loan[]
  savings: SavingsAccount[]
  fines: Fine[]
  transactions: Transaction[]
  stats: {
    totalSavings: number
    totalLoans: number
    totalFines: number
    totalTransactions: number
  }
}

export function MemberProfile({
  member,
  loans,
  savings,
  fines,
  transactions,
  stats,
}: MemberProfileProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [showLoanDialog, setShowLoanDialog] = useState(false)
  const [showSavingsDialog, setShowSavingsDialog] = useState(false)
  const [showFineDialog, setShowFineDialog] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [loanAmount, setLoanAmount] = useState("")
  const [loanInterestRate, setLoanInterestRate] = useState("")
  const [loanDueDate, setLoanDueDate] = useState("")
  const [loanPurpose, setLoanPurpose] = useState("")
  const [savingsAmount, setSavingsAmount] = useState("")
  const [savingsNarration, setSavingsNarration] = useState("")
  const [fineAmount, setFineAmount] = useState("")
  const [fineReason, setFineReason] = useState("")
  const [fineDescription, setFineDescription] = useState("")

  const handleStatusChange = async (status: "active" | "suspended" | "exited") => {
    setIsLoading(true)
    try {
      const result = await updateMemberStatusAction(member.id, status)
      if (result.success) {
        toast.success(`Member status updated to ${status}`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      toast.error("Please enter a message")
      return
    }
    setIsLoading(true)
    try {
      const result = await sendMemberSmsAction(member.id, smsMessage)
      if (result.success) {
        toast.success("SMS sent successfully")
        setShowSmsDialog(false)
        setSmsMessage("")
      } else {
        toast.error(result.error || "Failed to send SMS")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignLoan = async () => {
    if (!loanAmount || !loanInterestRate || !loanDueDate) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("amount", loanAmount)
      formData.append("interest_rate", loanInterestRate)
      formData.append("due_date", loanDueDate)
      formData.append("purpose", loanPurpose)
      const result = await assignLoanAction(member.id, {}, formData)
      if (result.success) {
        toast.success("Loan assigned successfully")
        setShowLoanDialog(false)
        setLoanAmount("")
        setLoanInterestRate("")
        setLoanDueDate("")
        setLoanPurpose("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to assign loan")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSavings = async () => {
    if (!savingsAmount) {
      toast.error("Please enter an amount")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("amount", savingsAmount)
      formData.append("narration", savingsNarration)
      const result = await addSavingsAction(member.id, {}, formData)
      if (result.success) {
        toast.success("Savings added successfully")
        setShowSavingsDialog(false)
        setSavingsAmount("")
        setSavingsNarration("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add savings")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFine = async () => {
    if (!fineAmount || !fineReason) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("member_id", member.id)
      formData.append("amount", fineAmount)
      formData.append("reason", fineReason)
      formData.append("description", fineDescription)
      const result = await addFineAction({}, formData)
      if (result.success) {
        toast.success("Fine added successfully")
        setShowFineDialog(false)
        setFineAmount("")
        setFineReason("")
        setFineDescription("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add fine")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "exited":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLoanStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "disbursed":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      case "settled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getFineStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "waived":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{member.full_name}</h1>
            <p className="text-muted-foreground">{member.member_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(member.status)}>
            {member.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSmsDialog(true)}>
                <Phone className="mr-2 h-4 w-4" />
                Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("suspended")}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("exited")}>
                <XCircle className="mr-2 h-4 w-4" />
                Exit Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUGX(stats.totalSavings)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUGX(stats.totalLoans)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUGX(stats.totalFines)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Member Details */}
      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{member.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{member.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{member.address || "No address"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDate(member.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowLoanDialog(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Assign Loan
            </Button>
          </div>
          {loans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No loans found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <Card key={loan.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getLoanStatusIcon(loan.status)}
                        <div>
                          <p className="font-medium">{loan.loan_ref}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(loan.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatUGX(loan.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {formatUGX(loan.balance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowSavingsDialog(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Savings
            </Button>
          </div>
          {savings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No savings accounts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savings.map((account) => (
                <Card key={account.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{account.account_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.account_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatUGX(account.balance)}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.is_locked ? "Locked" : "Active"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFineDialog(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Add Fine
            </Button>
          </div>
          {fines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No fines found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fines.map((fine) => (
                <Card key={fine.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getFineStatusIcon(fine.status)}
                        <div>
                          <p className="font-medium">{fine.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(fine.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatUGX(fine.amount)}</p>
                        <Badge variant={fine.status === "paid" ? "default" : "secondary"}>
                          {fine.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {transaction.type === "savings_deposit" || transaction.type === "fine_payment" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.narration || transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-medium",
                            transaction.type === "savings_deposit" || transaction.type === "fine_payment"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {transaction.type === "savings_deposit" || transaction.type === "fine_payment" ? "+" : "-"}
                          {formatUGX(transaction.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {transaction.balance_after != null ? formatUGX(transaction.balance_after) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to {member.full_name}</DialogTitle>
            <DialogDescription>
              Send a text message to this member's phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={member.phone || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSmsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendSms} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Loan to {member.full_name}</DialogTitle>
            <DialogDescription>
              Create a new loan for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Amount (UGX)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="Enter amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="Enter interest rate"
                value={loanInterestRate}
                onChange={(e) => setLoanInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Enter loan purpose..."
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLoan} disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Dialog */}
      <Dialog open={showSavingsDialog} onOpenChange={setShowSavingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Savings for {member.full_name}</DialogTitle>
            <DialogDescription>
              Add a savings deposit for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="savingsAmount">Amount (UGX)</Label>
              <Input
                id="savingsAmount"
                type="number"
                placeholder="Enter amount"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="narration">Narration</Label>
              <Textarea
                id="narration"
                placeholder="Enter narration..."
                value={savingsNarration}
                onChange={(e) => setSavingsNarration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSavings} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Savings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Dialog */}
      <Dialog open={showFineDialog} onOpenChange={setShowFineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fine for {member.full_name}</DialogTitle>
            <DialogDescription>
              Create a new fine for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fineAmount">Amount (UGX)</Label>
              <Input
                id="fineAmount"
                type="number"
                placeholder="Enter amount"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Enter reason"
                value={fineReason}
                onChange={(e) => setFineReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fineDescription">Description</Label>
              <Textarea
                id="fineDescription"
                placeholder="Enter description..."
                value={fineDescription}
                onChange={(e) => setFineDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFine} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Fine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
