"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableCardColumn<T> {
  key: keyof T
  title: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableCardProps<T> {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  data: T[]
  columns: DataTableCardColumn<T>[]
  itemsPerPage?: number
  onRowClick?: (row: T) => void
  emptyMessage?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  className?: string
  getRowId?: (row: T) => string | number
}

// Memoized table row component for widget performance
interface TableRowProps<T> {
  row: T
  columns: DataTableCardColumn<T>[]
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string | number
  index: number
}

const MemoizedTableRow = React.memo(function MemoizedTableRow<T>({
  row,
  columns,
  onRowClick,
  getRowId,
  index
}: TableRowProps<T>) {
  const rowId = React.useMemo(() => {
    return getRowId ? String(getRowId(row)) : String(index)
  }, [getRowId, row, index])

  const handleRowClick = React.useCallback(() => {
    onRowClick?.(row)
  }, [onRowClick, row])

  return (
    <TableRow
      key={rowId}
      className={onRowClick ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
      onClick={handleRowClick}
    >
      {columns.map((column) => (
        <TableCell 
          key={String(column.key)} 
          className={column.className}
        >
          <CellRenderer column={column} row={row} />
        </TableCell>
      ))}
    </TableRow>
  )
}) as <T>(props: TableRowProps<T>) => React.ReactElement

// Memoized cell renderer with error boundary for widget safety
interface CellRendererProps<T> {
  column: DataTableCardColumn<T>
  row: T
}

const CellRenderer = React.memo(function CellRenderer<T>({
  column,
  row
}: CellRendererProps<T>) {
  const value = row[column.key]

  try {
    if (column.render) {
      return <>{column.render(value, row)}</>
    }
    return <>{String(value ?? '')}</>
  } catch (error) {
    console.error('DataTableCard cell render error:', error)
    return <span className="text-red-500 text-xs">Error</span>
  }
}) as <T>(props: CellRendererProps<T>) => React.ReactElement

// Memoized pagination controls
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  startIndex: number
  itemsPerPage: number
  totalItems: number
}

const PaginationControls = React.memo(function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  itemsPerPage,
  totalItems
}: PaginationControlsProps) {
  const goToPrevious = React.useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1))
  }, [currentPage, onPageChange])

  const goToNext = React.useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }, [currentPage, totalPages, onPageChange])

  // Memoized visible pages calculation
  const visiblePages = React.useMemo((): number[] => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage === 1) {
      return [1, 2, 3]
    } else if (currentPage === totalPages) {
      return [totalPages - 2, totalPages - 1, totalPages]
    } else {
      return [currentPage - 1, currentPage, currentPage + 1]
    }
  }, [currentPage, totalPages])

  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {endIndex} of {totalItems}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="h-8 w-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

/**
 * Performance-optimized DataTableCard for dashboard widgets and modals
 * Designed for small datasets (< 100 records) with multiple instances per page
 * 
 * @param title - Card title
 * @param icon - Title icon component
 * @param data - Array of data to display (optimized for < 100 items)
 * @param columns - Column configuration
 * @param itemsPerPage - Items per page (default: 8)
 * @param onRowClick - Row click handler for navigation
 * @param emptyMessage - Message when no data
 * @param emptyIcon - Icon for empty state
 * @param className - Additional CSS classes
 * @param getRowId - Function to get unique row ID
 */
export const DataTableCard = React.memo(function DataTableCard<T>({
  title,
  icon: TitleIcon,
  data,
  columns,
  itemsPerPage = 8,
  onRowClick,
  emptyMessage = "No data available",
  emptyIcon: EmptyIcon,
  className = "",
  getRowId
}: DataTableCardProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1)

  // Memoized pagination calculations
  const paginationData = React.useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage)
    
    return {
      totalPages,
      startIndex,
      paginatedData
    }
  }, [data, currentPage, itemsPerPage])

  const { totalPages, startIndex, paginatedData } = paginationData

  // Reset to first page when data changes (with dependency optimization)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data.length]) // Only reset when data length changes, not data content

  // Memoized page change handler
  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  // Memoized record count display
  const recordCountDisplay = React.useMemo(() => {
    if (data.length === 0) return null
    return (
      <span className="text-sm font-normal text-muted-foreground ml-auto">
        {data.length} record{data.length !== 1 ? 's' : ''}
      </span>
    )
  }, [data.length])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {TitleIcon && <TitleIcon className="h-5 w-5" />}
          {title}
          {recordCountDisplay}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {EmptyIcon ? (
              <EmptyIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            ) : (
              <div className="h-8 w-8 mx-auto mb-2 opacity-50 rounded-full bg-muted flex items-center justify-center">
                📄
              </div>
            )}
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={String(column.key)} 
                      className={column.headerClassName}
                    >
                      {column.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <MemoizedTableRow
                    key={getRowId ? String(getRowId(row)) : String(startIndex + index)}
                    row={row}
                    columns={columns}
                    onRowClick={onRowClick}
                    getRowId={getRowId}
                    index={startIndex + index}
                  />
                ))}
              </TableBody>
            </Table>

            {/* Memoized Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                startIndex={startIndex}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}) as <T>(props: DataTableCardProps<T>) => React.ReactElement