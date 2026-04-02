"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { FileText, CreditCard, Loader2 } from "lucide-react"
import { Member } from "@/db/schema"
import { MemberIdCardDocument } from "@/lib/pdf/member-id-card"
import { ApplicationFormDocument } from "@/lib/pdf/application-form"
import { toast } from "sonner"

const SACCO = {
  name: "My SACCO",
  address: "Kampala, Uganda",
  phone: "+256 700 000 000",
  email: "info@sacco.ug",
}

interface PdfButtonsProps {
  member: Member
}

export function PdfButtons({ member }: PdfButtonsProps) {
  const [loadingId, setLoadingId] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)

  const downloadIdCard = async () => {
    setLoadingId(true)
    try {
      const doc = (
        <MemberIdCardDocument
          member={member}
          sacco={{ name: SACCO.name }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${member.member_code}-ID-Card.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("ID Card downloaded")
    } catch {
      toast.error("Failed to generate ID Card")
    } finally {
      setLoadingId(false)
    }
  }

  const downloadApplicationForm = async () => {
    setLoadingForm(true)
    try {
      const doc = (
        <ApplicationFormDocument
          member={member}
          sacco={SACCO}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${member.member_code}-Application-Form.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Application Form downloaded")
    } catch {
      toast.error("Failed to generate Application Form")
    } finally {
      setLoadingForm(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
        onClick={downloadIdCard}
        disabled={loadingId}
      >
        {loadingId ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4 mr-2" />
        )}
        Generate ID Card
      </Button>

      <Button
        type="button"
        variant="outline"
        className="border-teal-300 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
        onClick={downloadApplicationForm}
        disabled={loadingForm}
      >
        {loadingForm ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Application Form
      </Button>
    </>
  )
}