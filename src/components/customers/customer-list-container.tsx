"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, ChevronLeft, ChevronRight, Trash2, Pencil, Upload, Download, Loader2 } from "lucide-react"
import { formatPhone, formatDate, calculateAge, formatMonthDay } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"

export function CustomerListContainer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("query") ?? ""
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [inputValue, setInputValue] = useState(urlQuery)
  const debouncedQuery = useDebounce(inputValue, 400)
  const showSpinner = loading || inputValue !== debouncedQuery
  
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const page = Number(searchParams.get("page") ?? "1")
  const limit = 20

  // URL 파라미터가 변경되면 input 값 동기화 (뒤로가기 등)
  useEffect(() => {
    setInputValue(urlQuery)
  }, [urlQuery])

  // 디바운스된 쿼리가 변경되면 라우터 푸시
  useEffect(() => {
    if (debouncedQuery !== urlQuery) {
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedQuery) params.set("query", debouncedQuery)
      else params.delete("query")
      params.set("page", "1")
      router.push(`/admin/customers?${params.toString()}`)
    }
  }, [debouncedQuery, urlQuery, searchParams, router])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: "birth_date",
        order: "asc",
      })
      if (urlQuery) params.set("query", urlQuery)

      const res = await fetch(`/api/customers?${params}`)
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const json = await res.json()
      if (res.ok) {
        setCustomers(json.data)
        setTotal(json.total)
      } else {
        toast.error("고객 목록을 불러오지 못했습니다")
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
      toast.error("고객 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }, [page, urlQuery, router])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (inputValue === urlQuery) return
    const params = new URLSearchParams(searchParams.toString())
    if (inputValue) params.set("query", inputValue)
    else params.delete("query")
    params.set("page", "1")
    router.push(`/admin/customers?${params.toString()}`)
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`/admin/customers?${params}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`${deleteTarget.name} 고객이 삭제되었습니다`)
        fetchCustomers()
      } else {
        toast.error("삭제에 실패했습니다")
      }
    } catch {
      toast.error("삭제에 실패했습니다")
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">고객 관리</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => {
              const params = new URLSearchParams()
              if (urlQuery) params.set("query", urlQuery)
              window.location.href = `/api/customers/export?${params.toString()}`
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            엑셀 내보내기
          </Button>
          <Link href="/admin/customers/import" className="hidden sm:block">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              엑셀 임포트
            </Button>
          </Link>
          <Link href="/admin/customers/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              고객 등록
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          {showSpinner ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder="이름, 전화번호, 주소 검색..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      <div className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{total}</span>명
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">이름</TableHead>
              <TableHead className="w-28">생년월일</TableHead>
              <TableHead className="w-16">나이</TableHead>
              <TableHead className="w-16">성별</TableHead>
              <TableHead className="w-36">전화번호</TableHead>
              <TableHead className="w-28">자동차보험</TableHead>
              <TableHead className="w-32">차량 갱신일</TableHead>
              <TableHead>주소</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="h-12">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  {urlQuery ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{formatDate(customer.birth_date)}</TableCell>
                  <TableCell>{calculateAge(customer.birth_date) ?? "-"}</TableCell>
                  <TableCell>
                    {customer.gender && (
                      customer.gender === "M" ? (
                        <Badge variant="default">남</Badge>
                      ) : (
                        <Badge style={{ backgroundColor: "#fce4ec", color: "#c2185b", border: "1px solid #f48fb1" }}>여</Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell>{formatPhone(customer.phone)}</TableCell>
                  <TableCell>
                    {((customer as any).car_insurances?.[0]?.insurance_company) || "-"}
                  </TableCell>
                  <TableCell>
                    {formatMonthDay((customer as any).car_insurances?.[0]?.expiry_date) || "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {customer.home_address ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/customers/${customer.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(customer)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {urlQuery ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
          </div>
        ) : (
          customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/admin/customers/${customer.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(customer.birth_date)}
                    {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                  </p>
                  {customer.phone && (
                    <p className="text-sm text-muted-foreground">{formatPhone(customer.phone)}</p>
                  )}
                  {((customer as any).car_insurances?.[0]?.expiry_date) && (
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium">차량갱신:</span> {((customer as any).car_insurances?.[0]?.expiry_date)}
                    </p>
                  )}
                </div>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    전화
                  </a>
                )}
              </div>
              {customer.home_address && (
                <p className="mt-1 truncate text-sm text-muted-foreground">{customer.home_address}</p>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고객 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} 고객을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
