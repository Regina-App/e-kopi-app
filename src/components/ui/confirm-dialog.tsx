"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
  trigger?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText = "Batal",
  variant = "default",
  loading = false,
  trigger,
  icon: CustomIcon,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive"
  const defaultConfirmText = isDestructive ? "Hapus" : "Konfirmasi"
  const resolvedConfirmText = confirmText ?? defaultConfirmText

  const IconComponent =
    CustomIcon ?? (isDestructive ? AlertTriangle : AlertCircle)

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch {
      // Caller should handle errors
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isDestructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-left text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription className="text-left text-sm text-muted-foreground pl-13">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="sm:order-2"
          >
            {loading ? "Memproses..." : resolvedConfirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
