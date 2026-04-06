"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, User, ArrowRight, Loader2 } from "lucide-react"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 250)

  // Cmd+K / Ctrl+K 단축키
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // 검색 실행
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const params = new URLSearchParams({ query: debouncedQuery, limit: "8", page: "1" })
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setResults(json.data ?? [])
        setActiveIdx(0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (id: string) => {
      setOpen(false)
      setQuery("")
      setResults([])
      router.push(`/admin/customers/${id}`)
    },
    [router]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[activeIdx]) {
      handleSelect(results[activeIdx].id)
    }
  }

  return (
    <>
      {/* 헤더 검색 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">고객 검색</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(""); setResults([]) } }}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
          <div className="flex items-center border-b px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름, 전화번호, 주소 검색..."
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((c, idx) => (
                <li key={c.id}>
                  <button
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                      idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => handleSelect(c.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(c.birth_date)}
                          {calculateAge(c.birth_date) != null && ` · ${calculateAge(c.birth_date)}세`}
                          {c.phone && ` · ${formatPhone(c.phone)}`}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : query && !loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              "{query}" 검색 결과 없음
            </div>
          ) : !query ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              이름, 전화번호, 주소로 검색하세요
            </div>
          ) : null}

          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex gap-4">
            <span><kbd className="rounded border px-1">↑↓</kbd> 이동</span>
            <span><kbd className="rounded border px-1">↵</kbd> 선택</span>
            <span><kbd className="rounded border px-1">Esc</kbd> 닫기</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
