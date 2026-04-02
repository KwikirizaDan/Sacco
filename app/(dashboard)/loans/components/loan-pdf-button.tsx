// app/(dashboard)/loans/components/loan-pdf-button.tsx
"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { FileText, Loader2 } from "lucide-react"
import { LoanContractDocument } from "@/lib/pdf/loan-contract"
import { toast } from "sonner"

const SACCO = {
  name: "My SACCO",
  address: "Kampala, Uganda",
  phone: "+256 700 000 000",
  email: "info@sacco.ug",
}

export function LoanPdfButton({ loan }: { loan: any }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    try {
      const doc = (
        <LoanContractDocument
          loan={loan}
          member={{
            full_name: loan.member_name ?? "",
            member_code: loan.member_code ?? "",
            phone: loan.member_phone,
            national_id: loan.member_national_id,
            address: loan.member_address,
          }}
          sacco={SACCO}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${loan.loan_ref}-Contract.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Loan contract downloaded")
    } catch {
      toast.error("Failed to generate contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => handleDownload(e as unknown as Event)}
      className="text-teal-600"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      Download Contract PDF
    </DropdownMenuItem>
  )
}