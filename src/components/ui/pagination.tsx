"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  showTotalCount?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  showTotalCount = true,
  className,
  ...props
}: PaginationProps) {
  // Compute display range for items
  const startItem = totalItems !== undefined && totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem =
    totalItems !== undefined ? Math.min(currentPage * itemsPerPage, totalItems) : 0

  // Calculate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) {
        pages.push("ellipsis-start")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-end")
      }
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-3",
        className
      )}
      {...props}
    >
      {showTotalCount && (
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          {totalItems !== undefined && totalItems > 0 ? (
            <>
              Menampilkan{" "}
              <span className="font-medium text-foreground">{startItem}</span> -{" "}
              <span className="font-medium text-foreground">{endItem}</span> dari{" "}
              <span className="font-medium text-foreground">{totalItems}</span>{" "}
              data
            </>
          ) : totalPages > 0 ? (
            <>
              Halaman{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </>
          ) : (
            "Tidak ada data"
          )}
        </p>
      )}

      <div className="flex items-center space-x-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 gap-1 text-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>

        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (typeof page === "string") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              )
            }

            const isCurrent = page === currentPage
            return (
              <Button
                key={page}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-8 w-8 p-0 text-xs",
                  isCurrent && "pointer-events-none"
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                {page}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="h-8 px-2.5 gap-1 text-xs"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
