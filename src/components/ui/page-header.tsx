import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  badge?: React.ReactNode
  breadcrumbs?: React.ReactNode
  onBack?: () => void
  backLabel?: string
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  onBack,
  backLabel = "Kembali",
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 border-b border-border/60",
        className
      )}
      {...props}
    >
      {breadcrumbs && <div className="text-sm">{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-2 -ml-2 mb-1 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Button>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {(actions || children) && (
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
