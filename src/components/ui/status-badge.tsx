import * as React from "react"
import { cn } from "@/lib/utils"

export type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed"
  | "scheduled"
  | "confirmed"
  | "skipped"
  | string

export interface StatusConfig {
  label: string
  containerClass: string
  dotClass: string
}

const statusMap: Record<string, StatusConfig> = {
  pending: {
    label: "Menunggu",
    containerClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Disetujui",
    containerClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Ditolak",
    containerClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
  cancelled: {
    label: "Dibatalkan",
    containerClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  completed: {
    label: "Selesai",
    containerClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  scheduled: {
    label: "Terjadwal",
    containerClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    dotClass: "bg-indigo-500",
  },
  confirmed: {
    label: "Dikonfirmasi",
    containerClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  skipped: {
    label: "Dilewati",
    containerClass:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
  showDot?: boolean
  size?: "sm" | "default" | "lg"
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = "default",
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedKey = (status || "").toLowerCase().trim()
  const config = statusMap[normalizedKey] || {
    label: status || "-",
    containerClass:
      "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  }

  const displayLabel = label ?? config.label

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    default: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2 font-medium",
  }

  const dotSizeClasses = {
    sm: "h-1.5 w-1.5",
    default: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium rounded-full border shadow-2xs whitespace-nowrap select-none",
        sizeClasses[size],
        config.containerClass,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            dotSizeClasses[size],
            config.dotClass
          )}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </div>
  )
}
