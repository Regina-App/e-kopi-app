"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

export interface ColumnDef<T> {
  key: string
  header:
    | React.ReactNode
    | ((props: {
        column: ColumnDef<T>
        sortDirection: "asc" | "desc" | null
        toggleSort: () => void
      }) => React.ReactNode)
  accessorKey?: keyof T
  cell?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  className?: string
  hideOnMobile?: boolean
}

export interface RowAction<T> {
  label: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  variant?: "default" | "destructive"
  hidden?: (row: T) => boolean
}

export interface DataTableProps<T extends Record<string, any>> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowId?: (row: T, index: number) => string | number
  searchPlaceholder?: string
  searchColumn?: keyof T | string
  enableSearch?: boolean
  enableSelection?: boolean
  selectedRows?: (string | number)[]
  onSelectionChange?: (selectedIds: (string | number)[]) => void
  actions?: RowAction<T>[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  itemsPerPage?: number
  defaultSort?: { key: string; direction: "asc" | "desc" }
  className?: string
  renderMobileCard?: (
    row: T,
    isSelected: boolean,
    toggleSelect: () => void
  ) => React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns = [],
  getRowId = (row, index) => row.id ?? index,
  searchPlaceholder = "Cari data...",
  searchColumn,
  enableSearch = true,
  enableSelection = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  actions,
  isLoading = false,
  emptyTitle = "Belum Ada Data",
  emptyDescription = "Tidak ada data yang tersedia untuk ditampilkan saat ini.",
  emptyActionLabel,
  onEmptyAction,
  itemsPerPage = 10,
  defaultSort,
  className,
  renderMobileCard,
}: DataTableProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = React.useState<
    (string | number)[]
  >([])
  const isSelectionControlled = controlledSelectedRows !== undefined
  const selectedRows = isSelectionControlled
    ? controlledSelectedRows
    : internalSelectedRows

  const updateSelectedRows = (newSelected: (string | number)[]) => {
    if (!isSelectionControlled) {
      setInternalSelectedRows(newSelected)
    }
    onSelectionChange?.(newSelected)
  }

  // Search & Filter State
  const [searchTerm, setSearchTerm] = React.useState("")
  // Sort State
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "asc" | "desc" | null
  }>({
    key: defaultSort?.key ?? "",
    direction: defaultSort?.direction ?? null,
  })
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)

  // Filter Data
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data

    const lowerTerm = searchTerm.toLowerCase()

    return data.filter((row) => {
      if (searchColumn && row[searchColumn] !== undefined) {
        return String(row[searchColumn]).toLowerCase().includes(lowerTerm)
      }

      // Check all searchable columns or all columns if none specified as searchable
      const searchableCols = columns.filter((col) => col.searchable !== false)
      return searchableCols.some((col) => {
        const val = col.accessorKey ? row[col.accessorKey] : row[col.key]
        return val !== undefined && val !== null && String(val).toLowerCase().includes(lowerTerm)
      })
    })
  }, [data, searchTerm, searchColumn, columns])

  // Sort Data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    const col = columns.find((c) => c.key === sortConfig.key)
    const accessorKey = col?.accessorKey ?? sortConfig.key

    return [...filteredData].sort((a, b) => {
      const aVal = a[accessorKey]
      const bVal = b[accessorKey]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal
      }

      const strA = String(aVal).toLowerCase()
      const strB = String(bVal).toLowerCase()

      if (sortConfig.direction === "asc") {
        return strA.localeCompare(strB, "id")
      }
      return strB.localeCompare(strA, "id")
    })
  }, [filteredData, sortConfig, columns])

  // Paginate Data
  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage])

  // Handle Sort Toggle
  const handleToggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" }
      }
      return { key: "", direction: null }
    })
  }

  // Selection handlers
  const isAllCurrentSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, idx) =>
      selectedRows.includes(getRowId(row, idx))
    )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentIds = paginatedData.map((row, idx) => getRowId(row, idx))
      const combined = Array.from(new Set([...selectedRows, ...currentIds]))
      updateSelectedRows(combined)
    } else {
      const currentIds = new Set(
        paginatedData.map((row, idx) => getRowId(row, idx))
      )
      updateSelectedRows(selectedRows.filter((id) => !currentIds.has(id)))
    }
  }

  const handleToggleRow = (rowId: string | number) => {
    if (selectedRows.includes(rowId)) {
      updateSelectedRows(selectedRows.filter((id) => id !== rowId))
    } else {
      updateSelectedRows([...selectedRows, rowId])
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Bar: Search and Selection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {enableSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={searchPlaceholder}
              className="pl-9 h-9"
            />
          </div>
        )}

        {enableSelection && selectedRows.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <span>{selectedRows.length} item dipilih</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSelectedRows([])}
              className="h-6 px-2 text-xs text-primary hover:text-primary"
            >
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {enableSelection && (
                <TableHead className="w-12 px-3">
                  <Checkbox
                    checked={isAllCurrentSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Pilih semua data di halaman ini"
                  />
                </TableHead>
              )}

              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key
                const sortDir = isSorted ? sortConfig.direction : null

                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.sortable && "cursor-pointer select-none",
                      col.className
                    )}
                    onClick={() => {
                      if (col.sortable) {
                        handleToggleSort(col.key)
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {typeof col.header === "function"
                        ? col.header({
                            column: col,
                            sortDirection: sortDir,
                            toggleSort: () => handleToggleSort(col.key),
                          })
                        : col.header}

                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                          ) : sortDir === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )
              })}

              {actions && actions.length > 0 && (
                <TableHead className="w-12 text-right">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={`skeleton-${rIdx}`}>
                  {enableSelection && (
                    <TableCell className="px-3">
                      <div className="h-4 w-4 rounded-xs bg-muted animate-pulse" />
                    </TableCell>
                  )}
                  {columns.map((col, cIdx) => (
                    <TableCell key={`skeleton-${rIdx}-${cIdx}`}>
                      <div className="h-4 w-3/4 rounded-xs bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell>
                      <div className="h-6 w-6 rounded-xs bg-muted animate-pulse ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (enableSelection ? 1 : 0) +
                    (actions && actions.length > 0 ? 1 : 0)
                  }
                  className="h-48 text-center p-0"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowId = getRowId(row, rowIdx)
                const isSelected = selectedRows.includes(rowId)

                return (
                  <TableRow
                    key={String(rowId)}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {enableSelection && (
                      <TableCell className="px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(rowId)}
                          aria-label={`Pilih baris ${rowIdx + 1}`}
                        />
                      </TableCell>
                    )}

                    {columns.map((col) => {
                      const cellValue = col.cell
                        ? col.cell(row, rowIdx)
                        : col.accessorKey
                        ? row[col.accessorKey]
                        : row[col.key]

                      return (
                        <TableCell key={col.key} className={col.className}>
                          {cellValue ?? "-"}
                        </TableCell>
                      )
                    })}

                    {actions && actions.length > 0 && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Buka menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions
                              .filter((act) => !act.hidden?.(row))
                              .map((act, actIdx) => {
                                const Icon = act.icon
                                return (
                                  <DropdownMenuItem
                                    key={actIdx}
                                    onClick={() => act.onClick(row)}
                                    className={cn(
                                      act.variant === "destructive" &&
                                        "text-destructive focus:text-destructive"
                                    )}
                                  >
                                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                                    {act.label}
                                  </DropdownMenuItem>
                                )
                              })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`mob-skeleton-${idx}`}
              className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
            >
              <div className="h-5 w-1/3 bg-muted rounded-xs animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded-xs animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded-xs animate-pulse" />
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction}
            />
          </div>
        ) : (
          paginatedData.map((row, rowIdx) => {
            const rowId = getRowId(row, rowIdx)
            const isSelected = selectedRows.includes(rowId)

            if (renderMobileCard) {
              return (
                <div key={String(rowId)}>
                  {renderMobileCard(row, isSelected, () =>
                    handleToggleRow(rowId)
                  )}
                </div>
              )
            }

            // Default Mobile Card
            return (
              <div
                key={String(rowId)}
                className={cn(
                  "p-4 rounded-xl border border-border bg-card shadow-xs transition-colors space-y-3",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    {enableSelection && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(rowId)}
                      />
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{rowIdx + 1}
                    </span>
                  </div>

                  {actions && actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -mr-1"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aksi</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions
                          .filter((act) => !act.hidden?.(row))
                          .map((act, actIdx) => {
                            const Icon = act.icon
                            return (
                              <DropdownMenuItem
                                key={actIdx}
                                onClick={() => act.onClick(row)}
                                className={cn(
                                  act.variant === "destructive" &&
                                    "text-destructive focus:text-destructive"
                                )}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {act.label}
                              </DropdownMenuItem>
                            )
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((col) => {
                      const cellValue = col.cell
                        ? col.cell(row, rowIdx)
                        : col.accessorKey
                        ? row[col.accessorKey]
                        : row[col.key]

                      return (
                        <div
                          key={col.key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground">
                            {typeof col.header === "string" ? col.header : col.key}:
                          </span>
                          <span className="font-medium text-foreground text-right">
                            {cellValue ?? "-"}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
