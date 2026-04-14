"use client"

import { useActionState, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { toast } from "sonner"
import {
  updateGeneralSettingsAction,
  uploadLogoAction,
  SettingsState,
} from "../actions"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Upload, Building2 } from "lucide-react"

const initialState: SettingsState = {}

export function GeneralTab({ sacco }: { sacco: any }) {
  const [state, formAction, isPending] = useActionState(
    updateGeneralSettingsAction,
    initialState
  )
  const [color, setColor] = useState(sacco?.primary_color ?? "#16a34a")
  const [logoUrl, setLogoUrl] = useState(sacco?.logo_url ?? "")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (state.success) toast.success("Settings saved successfully!")
    if (state.error) toast.error(state.error)
  }, [state])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("logo", file)
        const res = await uploadLogoAction({}, fd)
        if (res.success && res.url) {
          setLogoUrl(res.url)
          toast.success("Logo uploaded!")
        } else {
          toast.error(res.error ?? "Upload failed")
        }
      } finally {
        setUploading(false)
      }
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            SACCO Logo
          </CardTitle>
          <CardDescription>Upload your SACCO logo. Max 2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-muted bg-muted">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {sacco?.name?.slice(0, 1) ?? "S"}
                </span>
              )}
            </div>
            <div
              {...getRootProps()}
              className={`flex-1 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG up to 2MB
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SACCO Information</CardTitle>
          <CardDescription>Basic details about your SACCO</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4" key={sacco?.id}>
            <div className="space-y-1.5">
              <Label htmlFor="name">SACCO Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={sacco?.name ?? ""}
                placeholder="e.g. Kampala Savings SACCO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={sacco?.contact_email ?? ""}
                  placeholder="info@yoursacco.ug"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  defaultValue={sacco?.contact_phone ?? ""}
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={sacco?.address ?? ""}
                placeholder="Physical address"
              />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="primary_color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input"
                />
                <Input
                  id="primary_color"
                  name="primary_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#16a34a"
                  className="flex-1 font-mono"
                />
                <div
                  className="h-10 w-10 shrink-0 rounded-md border border-input"
                  style={{ backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This color is used for buttons, badges, and accents throughout
                the app.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
