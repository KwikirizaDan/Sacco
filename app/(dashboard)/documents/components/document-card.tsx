"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Image,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  ExternalLink,
  User,
  Calendar,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { deleteDocumentAction } from "../actions"
import { toast } from "sonner"
import { PreviewDialog } from "./preview-dialog"
import { typeLabels, typeColors } from "./documents-client"

export function DocumentCard({ doc }: { doc: any }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isPdf = doc.file_name?.toLowerCase().endsWith(".pdf")
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name ?? "")

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteDocumentAction(doc.id, doc.blob_url)
    setDeleting(false)
    if (res.success) {
      toast.success("Document deleted")
      setDeleteOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Preview Area */}
        <div
          className="relative h-36 bg-muted/30 flex items-center justify-center cursor-pointer border-b"
          onClick={() => setPreviewOpen(true)}
        >
          {isImage ? (
            <img
              src={doc.blob_url}
              alt={doc.file_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-40" />
              <span className="text-xs font-mono uppercase">
                {doc.file_name?.split(".").pop()}
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                setPreviewOpen(true)
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
          </div>

          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[doc.type] ?? ""}`}>
              {typeLabels[doc.type] ?? doc.type}
            </span>
          </div>

          {/* Actions Menu */}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(doc.blob_url, "_blank")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(doc.blob_url, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card Info */}
        <CardContent className="pt-3 pb-3 px-3 space-y-2">
          <p className="text-sm font-medium truncate" title={doc.file_name}>
            {doc.file_name}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{doc.member_name ?? "—"}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono shrink-0">{doc.member_code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            {formatDate(doc.created_at)}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => window.open(doc.blob_url, "_blank")}
            >
              <Download className="h-2 w-2 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <PreviewDialog
        doc={doc}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{doc.file_name}</strong> from storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}