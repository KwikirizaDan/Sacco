"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface ImportExcelProps {
  open: boolean
  onClose: () => void
}

interface ParsedRow {
  full_name: string
  phone: string
  email: string
  national_id: string
  address: string
  valid: boolean
  errors: string[]
}

export function ImportExcel({ open, onClose }: ImportExcelProps) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[]

      const parsed: ParsedRow[] = json.map((row) => {
        const errors: string[] = []
        const full_name = String(row["Full Name"] ?? "").trim()
        const phone = String(row["Phone"] ?? "").trim()
        const email = String(row["Email"] ?? "").trim()
        const national_id = String(row["National ID"] ?? "").trim()
        const address = String(row["Address"] ?? "").trim()

        if (!full_name) errors.push("Full Name required")
        if (!phone || phone.length < 9) errors.push("Valid phone required")
        if (!national_id) errors.push("National ID required")

        return {
          full_name,
          phone,
          email,
          national_id,
          address,
          valid: errors.length === 0,
          errors,
        }
      })

      setRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  })

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleImport = async () => {
    setImporting(true)
    try {
      // TODO: call server action to bulk insert validRows
      toast.success(`${validRows.length} members imported successfully`)
      setRows([])
      onClose()
    } catch {
      toast.error("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Members from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with columns: Full Name, Phone, Email, National ID, Address
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium">
              {isDragActive ? "Drop your file here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports .xlsx and .xls files
            </p>
            <Button variant="outline" className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Browse File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {validRows.length} valid
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3.5 w-3.5" />
                {invalidRows.length} invalid
              </Badge>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between p-3 text-sm ${
                    !row.valid ? "bg-destructive/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">{row.full_name || "—"}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.phone} · {row.national_id}
                    </p>
                  </div>
                  {row.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="text-right">
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive mt-0.5">
                        {row.errors.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setRows([])}
              >
                Reset
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
              >
                {importing ? "Importing..." : `Import ${validRows.length} Members`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}