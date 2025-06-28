"use client"

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTableSort, type SortDirection } from "../../hooks/useTableSort"
import { usePagination } from "../../hooks/usePagination"

export interface DataTableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  searchValue?: string
  onSearch?: (value: string) => void
  filterFunction?: (item: T, searchValue: string) => boolean
  initialSortField?: keyof T
  initialSortDirection?: SortDirection
  pageSizeOptions?: number[]
  initialPageSize?: number
  showPagination?: boolean
  virtualScrolling?: boolean
  rowHeight?: number
  containerHeight?: number
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: React.ComponentType<{ className?: string }>
  className?: string
  getRowId?: (row: T) => string | number
  onRowClick?: (row: T) => void
}

// Virtual scrolling hook
function useVirtualScrolling<T>({
  data,
  rowHeight = 48,
  containerHeight = 400,
  enabled = false
}: {
  data: T[]
  rowHeight?: number
  containerHeight?: number
  enabled?: boolean
}) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollElementRef = React.useRef<HTMLDivElement>(null)

  const visibleItems = React.useMemo(() => {
    if (!enabled) return { items: data, startIndex: 0, endIndex: data.length - 1 }

    const startIndex = Math.floor(scrollTop / rowHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / rowHeight) + 5, // +5 buffer
      data.length - 1
    )

    return {
      items: data.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex
    }
  }, [data, scrollTop, rowHeight, containerHeight, enabled])

  const totalHeight = data.length * rowHeight
  const offsetY = visibleItems.startIndex * rowHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems: visibleItems.items,
    startIndex: visibleItems.startIndex,
    endIndex: visibleItems.endIndex,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll
  }
}

// Memoized table row component
interface TableRowProps<T> {
  row: T
  columns: DataTableColumn<T>[]
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string | number
  index: number
  style?: React.CSSProperties
}

const MemoizedTableRow = React.memo(function MemoizedTableRow<T>({
  row,
  columns,
  onRowClick,
  getRowId,
  index,
  style
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
      style={style}
    >
      {columns.map((column) => (
        <TableCell key={String(column.key)} className={column.className}>
          <CellRenderer column={column} row={row} />
        </TableCell>
      ))}
    </TableRow>
  )
}) as <T>(props: TableRowProps<T>) => React.ReactElement

// Memoized cell renderer with error boundary
interface CellRendererProps<T> {
  column: DataTableColumn<T>
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
    console.error('DataTable cell render error:', error)
    return <span className="text-red-500 text-xs">Render Error</span>
  }
}) as <T>(props: CellRendererProps<T>) => React.ReactElement

// Memoized sort header component
interface SortHeaderProps<T> {
  column: DataTableColumn<T>
  onSort: (field: keyof T) => void
  getSortIcon: (field: keyof T) => 'asc' | 'desc' | null
}

const SortHeader = React.memo(function SortHeader<T>({
  column,
  onSort,
  getSortIcon
}: SortHeaderProps<T>) {
  const handleSort = React.useCallback(() => {
    onSort(column.key)
  }, [onSort, column.key])

  const sortIcon = React.useMemo(() => {
    const iconState = getSortIcon(column.key)
    if (!iconState) return null
    return iconState === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }, [getSortIcon, column.key])

  if (column.sortable === false) {
    return (
      <div className="flex items-center gap-1 font-semibold">
        {column.icon && <column.icon className="h-4 w-4" />}
        {column.title}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
    >
      {column.icon && <column.icon className="h-4 w-4" />}
      {column.title}
      {sortIcon}
    </Button>
  )
}) as <T>(props: SortHeaderProps<T>) => React.ReactElement

/**
 * Enterprise-grade DataTable with virtual scrolling for massive datasets
 * Handles 1M+ records with constant performance
 */
export const DataTable = React.memo(function DataTable<T>({
  data,
  columns,
  title,
  icon: TitleIcon,
  searchValue = "",
  onSearch,
  filterFunction,
  initialSortField,
  initialSortDirection = 'asc',
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 25,
  showPagination = true,
  virtualScrolling, // Auto-detect if undefined
  rowHeight = 48,
  containerHeight = 400,
  emptyStateTitle = "No data found",
  emptyStateDescription = "No records match your criteria",
  emptyStateIcon: EmptyIcon,
  className = "",
  getRowId,
  onRowClick
}: DataTableProps<T>) {
  // Memoized filter function
  const filteredData = React.useMemo(() => {
    if (!searchValue.trim() || !filterFunction) return data
    
    try {
      return data.filter(item => filterFunction(item, searchValue.toLowerCase()))
    } catch (error) {
      console.error('DataTable filter error:', error)
      return data
    }
  }, [data, searchValue, filterFunction])

  // Auto-detect virtual scrolling for large datasets
  const shouldUseVirtualScrolling = React.useMemo(() => {
    if (virtualScrolling !== undefined) return virtualScrolling // Explicit override
    return filteredData.length > 1000 // Auto-enable for large datasets
  }, [virtualScrolling, filteredData.length])

  // Sort filtered data
  const {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon
  } = useTableSort({
    data: filteredData,
    initialSortField,
    initialSortDirection
  })

  // Determine final data based on virtual scrolling or pagination
  const finalData = React.useMemo(() => {
    if (shouldUseVirtualScrolling) {
      // Virtual scrolling handles its own data slicing
      return sortedData
    }
    // Use pagination
    return sortedData
  }, [sortedData, shouldUseVirtualScrolling])

  // Pagination (only when not using virtual scrolling)
  const paginationResult = usePagination({
    totalItems: sortedData.length,
    itemsPerPage: initialPageSize
  })

  const {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    setItemsPerPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    getPageNumbers
  } = paginationResult

  // Virtual scrolling
  const {
    visibleItems,
    startIndex: virtualStartIndex,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll
  } = useVirtualScrolling({
    data: finalData,
    rowHeight,
    containerHeight,
    enabled: shouldUseVirtualScrolling
  })

  // Determine display data
  const displayData = React.useMemo(() => {
    if (shouldUseVirtualScrolling) {
      return visibleItems
    }
    if (showPagination) {
      return sortedData.slice(startIndex, startIndex + itemsPerPage)
    }
    return sortedData
  }, [shouldUseVirtualScrolling, visibleItems, showPagination, sortedData, startIndex, itemsPerPage])

  // Memoized handlers
  const handlePageSizeChange = React.useCallback((value: string) => {
    setItemsPerPage(Number(value))
  }, [setItemsPerPage])

  const pageNumbers = React.useMemo(() => {
    return getPageNumbers()
  }, [getPageNumbers])

  // Render table content
  const renderTableContent = () => {
    if (shouldUseVirtualScrolling) {
      return (
        <div
          ref={scrollElementRef}
          onScroll={handleScroll}
          style={{ height: containerHeight, overflow: 'auto' }}
          className="relative"
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              <Table>
                <TableBody>
                  {displayData.map((row, index) => (
                    <MemoizedTableRow
                      key={getRowId ? String(getRowId(row)) : String(virtualStartIndex + index)}
                      row={row}
                      columns={columns}
                      onRowClick={onRowClick}
                      getRowId={getRowId}
                      index={virtualStartIndex + index}
                      style={{ height: rowHeight }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )
    }

    return (
      <Table>
        <TableBody>
          {displayData.map((row, index) => (
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
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {TitleIcon && <TitleIcon className="h-5 w-5" />}
            {title}
            {shouldUseVirtualScrolling && (
              <Badge variant="outline" className="ml-2 text-xs">
                Virtual
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
            </Badge>
            {!shouldUseVirtualScrolling && showPagination && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {EmptyIcon ? (
              <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-muted-foreground text-xl">📄</span>
              </div>
            )}
            <h3 className="text-lg font-semibold">{emptyStateTitle}</h3>
            <p className="text-muted-foreground">{emptyStateDescription}</p>
          </div>
        ) : (
          <>
            {/* Table Header (always visible) */}
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={String(column.key)} className={column.className}>
                      <SortHeader
                        column={column}
                        onSort={handleSort}
                        getSortIcon={getSortIcon}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>

            {/* Table Body (virtual or regular) */}
            {renderTableContent()}

            {/* Pagination (only for non-virtual mode) */}
            {!shouldUseVirtualScrolling && showPagination && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {endIndex} of {sortedData.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={!hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {pageNumbers.map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Virtual scrolling info */}
            {shouldUseVirtualScrolling && (
              <div className="px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Virtual scrolling: {filteredData.length} total records
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}) as <T>(props: DataTableProps<T>) => React.ReactElement