// app/(dashboard)/loans/interest-rates/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
} from "lucide-react"
import {
  addInterestRateAction,
  updateInterestRateAction,
  deleteInterestRateAction,
  getInterestRatesAction,
} from "../components/interest-rate-actions"

export default function InterestRatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState({
    min_amount: "",
    max_amount: "",
    rate: "",
    rate_type: "monthly" as "daily" | "monthly" | "annual",
  })

  // Fetch rates on mount
  useEffect(() => {
    refreshRates()
  }, [])

  // Refresh rates list
  const refreshRates = async () => {
    try {
      const newRates = await getInterestRatesAction()
      setRates(newRates)
    } catch (error) {
      console.error("Failed to refresh rates:", error)
      toast.error("Failed to load interest rates")
    } finally {
      setInitialLoading(false)
    }
  }

  // Handle add new interest rate
  const handleAdd = async () => {
    if (!formData.min_amount || !formData.max_amount || !formData.rate) {
      toast.error("Please fill all fields")
      return
    }

    const minAmount = parseFloat(formData.min_amount)
    const maxAmount = parseFloat(formData.max_amount)
    const rate = parseFloat(formData.rate)

    if (minAmount >= maxAmount) {
      toast.error("Minimum amount must be less than maximum amount")
      return
    }

    if (rate <= 0 || rate > 100) {
      toast.error("Interest rate must be between 0 and 100")
      return
    }

    // Check for overlapping ranges (strict: must share some space, not just endpoints)
    const minInCents = minAmount * 100
    const maxInCents = maxAmount * 100
    const overlapping = rates.some(
      (rate) =>
        (minInCents < rate.max_amount && maxInCents > rate.min_amount)
    )

    if (overlapping) {
      toast.error("This amount range overlaps with an existing range")
      return
    }

    setLoading(true)
    try {
      const result = await addInterestRateAction({
        min_amount: minAmount,
        max_amount: maxAmount,
        rate: rate,
        rate_type: formData.rate_type,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Interest rate added successfully")
      setIsAdding(false)
      setFormData({
        min_amount: "",
        max_amount: "",
        rate: "",
        rate_type: "monthly",
      })
      await refreshRates()
    } catch (error) {
      toast.error("Failed to add interest rate")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Handle update interest rate
  const handleUpdate = async (id: string) => {
    if (!formData.min_amount || !formData.max_amount || !formData.rate) {
      toast.error("Please fill all fields")
      return
    }

    const minAmount = parseFloat(formData.min_amount)
    const maxAmount = parseFloat(formData.max_amount)
    const rate = parseFloat(formData.rate)

    if (minAmount >= maxAmount) {
      toast.error("Minimum amount must be less than maximum amount")
      return
    }

    if (rate <= 0 || rate > 100) {
      toast.error("Interest rate must be between 0 and 100")
      return
    }

    // Check for overlapping ranges (strict: must share some space, excluding current rate)
    const minInCents = minAmount * 100
    const maxInCents = maxAmount * 100
    const overlapping = rates.some(
      (r) =>
        r.id !== id && (minInCents < r.max_amount && maxInCents > r.min_amount)
    )

    if (overlapping) {
      toast.error("This amount range overlaps with an existing range")
      return
    }

    setLoading(true)
    try {
      const result = await updateInterestRateAction(id, {
        min_amount: minAmount,
        max_amount: maxAmount,
        rate: rate,
        rate_type: formData.rate_type,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Interest rate updated successfully")
      setEditingId(null)
      setFormData({
        min_amount: "",
        max_amount: "",
        rate: "",
        rate_type: "monthly",
      })
      await refreshRates()
    } catch (error) {
      toast.error("Failed to update interest rate")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete interest rate
  const handleDelete = async (
    id: string,
    minAmount: number,
    maxAmount: number
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the interest rate for UGX ${(
          minAmount / 100
        ).toLocaleString()} - UGX ${(maxAmount / 100).toLocaleString()}?`
      )
    )
      return

    setLoading(true)
    try {
      const result = await deleteInterestRateAction(id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Interest rate deleted successfully")
      await refreshRates()
    } catch (error) {
      toast.error("Failed to delete interest rate")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Start editing a rate
  const startEdit = (rate: any) => {
    setEditingId(rate.id)
    setFormData({
      min_amount: (rate.min_amount / 100).toString(),
      max_amount: (rate.max_amount / 100).toString(),
      rate: rate.rate,
      rate_type: rate.rate_type,
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      min_amount: "",
      max_amount: "",
      rate: "",
      rate_type: "monthly",
    })
  }

  // Cancel adding
  const cancelAdd = () => {
    setIsAdding(false)
    setFormData({
      min_amount: "",
      max_amount: "",
      rate: "",
      rate_type: "monthly",
    })
  }

  // Format currency for display
  const formatCurrency = (cents: number) => {
    return `UGX ${(cents / 100).toLocaleString()}`
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/loans">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Interest Rate Configuration
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define interest rates based on loan amount ranges
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                How Interest Rates Work
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                When a member applies for a loan, the system checks the loan
                amount against these ranges and applies the corresponding
                interest rate. Make sure the ranges do not overlap and cover
                all possible loan amounts your SACCO offers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Rate Button */}
      {!isAdding && (
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Interest Rate Range
        </Button>
      )}

      {/* Add Form */}
      {isAdding && (
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              Add New Interest Rate Range
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Min Amount (UGX)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 20,000"
                  value={formData.min_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, min_amount: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum loan amount
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Amount (UGX)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 40,000"
                  value={formData.max_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, max_amount: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum loan amount
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 10"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage per period
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Rate Type</Label>
                <Select
                  value={formData.rate_type}
                  onValueChange={(v: any) =>
                    setFormData({ ...formData, rate_type: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Interest</SelectItem>
                    <SelectItem value="monthly">Monthly Interest</SelectItem>
                    <SelectItem value="annual">Annual Interest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How interest is calculated
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={cancelAdd} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Rate Range
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rates Table */}
      {rates.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%]">Amount Range</TableHead>
                <TableHead className="w-[25%]">Interest Rate</TableHead>
                <TableHead className="w-[25%]">Rate Type</TableHead>
                <TableHead className="w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id} className="group">
                  {editingId === rate.id ? (
                    // Edit Mode
                    <>
                      <TableCell>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={formData.min_amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                min_amount: e.target.value,
                              })
                            }
                            className="w-28"
                            placeholder="Min"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="number"
                            value={formData.max_amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                max_amount: e.target.value,
                              })
                            }
                            className="w-28"
                            placeholder="Max"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.rate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rate: e.target.value,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={formData.rate_type}
                          onValueChange={(v: any) =>
                            setFormData({ ...formData, rate_type: v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdate(rate.id)}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <TableCell className="font-medium">
                        {formatCurrency(rate.min_amount)} -{" "}
                        {formatCurrency(rate.max_amount)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {rate.rate}%
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">
                        {rate.rate_type}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(rate)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDelete(rate.id, rate.min_amount, rate.max_amount)
                            }
                            disabled={loading}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No interest rates configured</p>
          <p className="text-sm mt-1">
            Click "Add Interest Rate Range" to set up your first rate
            tier.
          </p>
        </div>
      )}

      {/* Summary Card */}
      {rates.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Coverage Summary</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rates.length} rate tier{rates.length !== 1 ? "s" : ""}{" "}
                  configured
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Range Coverage</p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {formatCurrency(rates[0]?.min_amount || 0)} to{" "}
                  {formatCurrency(rates[rates.length - 1]?.max_amount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
