"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, FileText, User, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { typeLabels, typeColors } from "./documents-client"

interface PreviewDialogProps {
  doc: any
  open: boolean
  onClose: () => void
}

export function PreviewDialog({ doc, open, onClose }: PreviewDialogProps) {
  const isPdf = doc.file_name?.toLowerCase().endsWith(".pdf")
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name ?? "")

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-base">{doc.file_name}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[doc.type] ?? ""}`}>
                  {typeLabels[doc.type] ?? doc.type}
                </span>
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {doc.member_name} · {doc.member_code}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(doc.created_at)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.blob_url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(doc.blob_url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/20 min-h-0">
          {isImage && (
            <img
              src={doc.blob_url}
              alt={doc.file_name}
              className="w-full h-auto max-h-[65vh] object-contain"
            />
          )}
          {isPdf && (
            <iframe
              src={`${doc.blob_url}#toolbar=1`}
              className="w-full h-[65vh]"
              title={doc.file_name}
            />
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
              <FileText className="h-16 w-16 opacity-30" />
              <p className="text-sm">Preview not available for this file type</p>
              <Button onClick={() => window.open(doc.blob_url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}