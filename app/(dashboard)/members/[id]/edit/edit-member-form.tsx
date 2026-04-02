"use client"

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { editMemberAction, deleteMemberAction, MemberFormState } from "../../actions"
import { Member } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Camera, Loader2, ArrowLeft, User, Upload, Trash2 } from "lucide-react"

interface EditMemberFormProps {
  member: Member
}

const initialState: MemberFormState = {}

function SectionHeader({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center tracking-wide mt-0.5">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
      {children}
    </div>
  )
}

function Field({
  id,
  label,
  required,
  error,
  span,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  span?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span ? "sm:col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"

export function EditMemberForm({ member }: EditMemberFormProps) {
  const router = useRouter()
  const [photoPreview, setPhotoPreview] = useState(member.photo_url ?? "")
  const [photoUrl, setPhotoUrl] = useState(member.photo_url ?? "")
  const [deleting, setDeleting] = useState(false)

  const boundAction = editMemberAction.bind(null, member.id)
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Member updated successfully!")
      router.push("/members")
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0]
      if (!file) return
      const preview = URL.createObjectURL(file)
      setPhotoPreview(preview)
      setPhotoUrl(preview)
    },
  })

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteMemberAction(member.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Member removed successfully")
      router.push("/members")
    } else {
      toast.error(res.error)
    }
  }

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]

  return (
    <form action={formAction} className="max-w-2xl mx-auto">
      <input type="hidden" name="photo_url" value={photoUrl} />

      {/* ── Section 1: Photo ── */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-sm">
        <SectionHeader
          step={1}
          title="Profile Photo"
          description="Upload a clear, recent photo of the member."
        />

        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-2xl border-2 border-border overflow-hidden bg-muted flex items-center justify-center shadow-inner">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-9 w-9 text-muted-foreground" />
              )}
            </div>
            {photoPreview && (
              <div className="absolute -bottom-1.5 -right-1.5 bg-primary rounded-full p-1 shadow">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>

          <div
            {...getRootProps()}
            className={`flex-1 border-2 border-dashed rounded-xl px-5 py-4 cursor-pointer transition-all
              ${
                isDragActive
                  ? "border-ring bg-accent"
                  : "border-border hover:border-ring/50 hover:bg-accent/50"
              }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? "Drop your photo here" : "Click or drag to change photo"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG or WEBP • Max 5MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Personal Info ── */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-sm">
        <SectionHeader
          step={2}
          title="Personal Information"
          description="Update the member's basic contact and identity details."
        />

        <FieldGroup>
          <Field id="full_name" label="Full Name" required error={fieldError("full_name")} span>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={member.full_name}
              placeholder="Enter full name"
              className={inputClass}
            />
          </Field>

          <Field id="phone" label="Phone Number" required error={fieldError("phone")}>
            <Input
              id="phone"
              name="phone"
              defaultValue={member.phone ?? ""}
              placeholder="07XX XXX XXX"
              className={inputClass}
            />
          </Field>

          <Field id="email" label="Email Address" error={fieldError("email")}>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={member.email ?? ""}
              placeholder="email@example.com"
              className={inputClass}
            />
          </Field>

          <Field id="national_id" label="National ID" required error={fieldError("national_id")}>
            <Input
              id="national_id"
              name="national_id"
              defaultValue={member.national_id ?? ""}
              placeholder="CM XXXXXXXXXX"
              className={inputClass}
            />
          </Field>

          <Field id="date_of_birth" label="Date of Birth">
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={member.date_of_birth ?? ""}
              className={inputClass}
            />
          </Field>

          <Field id="address" label="Physical Address" span>
            <Input
              id="address"
              name="address"
              defaultValue={member.address ?? ""}
              placeholder="Street, area or town"
              className={inputClass}
            />
          </Field>

          <Field id="status" label="Membership Status" span>
            <Select name="status" defaultValue={member.status}>
              <SelectTrigger className={`${inputClass} w-full flex`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="suspended">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                    Suspended
                  </span>
                </SelectItem>
                <SelectItem value="exited">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
                    Exited
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      {/* ── Section 3: Next of Kin ── */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <SectionHeader
          step={3}
          title="Next of Kin"
          description="Optional emergency contact information."
        />

        <FieldGroup>
          <Field id="next_of_kin" label="Full Name">
            <Input
              id="next_of_kin"
              name="next_of_kin"
              defaultValue={member.next_of_kin ?? ""}
              placeholder="Next of kin name"
              className={inputClass}
            />
          </Field>
          <Field id="next_of_kin_phone" label="Phone Number">
            <Input
              id="next_of_kin_phone"
              name="next_of_kin_phone"
              defaultValue={member.next_of_kin_phone ?? ""}
              placeholder="07XX XXX XXX"
              className={inputClass}
            />
          </Field>
        </FieldGroup>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2 pb-8">
        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger>
            <button
              type="button"
              disabled={deleting}
              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Member
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {member.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this member and all their associated
                data including loans, savings, fines, and transactions. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>

          <Button
            type="submit"
            disabled={isPending}
            className="h-10 px-6 rounded-xl text-sm font-medium tracking-wide transition-all shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes →"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}