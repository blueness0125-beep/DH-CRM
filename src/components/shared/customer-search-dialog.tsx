"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"

type CustomerSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer) => void
  excludeIds?: string[]
  title?: string
}

export function CustomerSearchDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
  title = "고객 검색",
}: CustomerSearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?query=${encodeURIComponent(q)}&limit=10`)
      const json = await res.json()
      if (res.ok) {
        setResults((json.data as Customer[]).filter((c) => !excludeIds.includes(c.id)))
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [excludeIds])

  function handleQueryChange(value: string) {
    setQuery(value)
    const timer = setTimeout(() => search(value), 300)
    return () => clearTimeout(timer)
  }

  function handleSelect(customer: Customer) {
    onSelect(customer)
    onOpenChange(false)
    setQuery("")
    setResults([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름 또는 전화번호 검색..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading && (
              <p className="py-4 text-center text-sm text-muted-foreground">검색 중...</p>
            )}
            {!loading && query && results.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">검색 결과가 없습니다</p>
            )}
            {results.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(customer.birth_date)}
                    {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatPhone(customer.phone)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
