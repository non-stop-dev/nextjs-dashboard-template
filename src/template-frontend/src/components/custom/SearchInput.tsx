"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDebounce } from "@/hooks/useDebounce"

interface SearchInputBaseProps {
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
  defaultValue?: string
  className?: string
}

interface SearchInputCardProps extends SearchInputBaseProps {
  title?: string
  description?: string
}

/**
 * Compact search input - just input field with icon
 * Perfect for inline layouts and toolbars
 */
const SearchInputCompact = React.memo(function SearchInputCompact({
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  defaultValue = "",
  className = ""
}: SearchInputBaseProps) {
  const [inputValue, setInputValue] = React.useState(defaultValue)
  const debouncedValue = useDebounce(inputValue, debounceMs)

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  React.useEffect(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground bg-background" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className="pl-10 bg-background text-foreground border-foreground"
      />
    </div>
  )
})

/**
 * Full search input with card wrapper
 * Perfect for dedicated search sections and forms
 */
const SearchInputCard = React.memo(function SearchInputCard({
  onSearch,
  placeholder = "Search...",
  title = "Search",
  description,
  debounceMs = 300,
  defaultValue = "",
  className = ""
}: SearchInputCardProps) {
  const [inputValue, setInputValue] = React.useState(defaultValue)
  const debouncedValue = useDebounce(inputValue, debounceMs)

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  React.useEffect(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`relative ${className}`}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            className="pl-10"
          />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
})

export { SearchInputCompact, SearchInputCard }