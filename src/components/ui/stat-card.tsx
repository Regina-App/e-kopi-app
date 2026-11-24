"use client"

import * as React from "react"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface StatItem {
  label: string
  value: string | number
  color?: string
}

export type StatTrend = "up" | "down" | "neutral"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value?: string | number
  description?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBg?: string
  trend?: StatTrend
  trendValue?: string | number
  trendLabel?: string
  badge?: React.ReactNode
  items?: StatItem[]
  progress?: {
    value: number
    label?: string
  }
  footer?: React.ReactNode
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  trendValue,
  trendLabel,
  badge,
  items,
  progress,
  footer,
  className,
  children,
  ...props
}: StatCardProps) {
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    down: {
      icon: TrendingDown,
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    },
    neutral: {
      icon: Minus,
      color: "text-muted-foreground bg-muted border-border",
    },
  }

  const TrendIcon = trend ? trendConfig[trend]?.icon : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-xs transition-shadow duration-200 hover:shadow-md",
        className
      )}
      {...(props as any)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              {title}
            </h4>
            {value !== undefined && (
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Trend indicator and description */}
      {(trend || trendValue || description) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {trend && TrendIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium text-[11px]",
                trendConfig[trend].color
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trendValue}
            </span>
          )}
          {trendLabel && (
            <span className="text-muted-foreground">{trendLabel}</span>
          )}
          {description && !trendLabel && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-muted/50 p-3 text-xs">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={cn("font-semibold text-foreground", item.color)}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {progress && (
        <div className="mt-4 space-y-1.5">
          {progress.label && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.label}</span>
              <span className="font-semibold text-foreground">
                {Math.round(progress.value)}%
              </span>
            </div>
          )}
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
              style={{
                width: `${Math.min(100, Math.max(0, progress.value))}%`,
              }}
            />
          </div>
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}

      {footer && (
        <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </motion.div>
  )
}
