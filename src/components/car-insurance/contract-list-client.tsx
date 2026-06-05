"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Car, Download, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import type { ContractListItem } from "@/lib/services/car-insurance-contracts-query"

type Mode = "recent45" | "month" | "range"

function currentMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function todayLocalString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** 현재 필터 상태 → API 쿼리스트링. range 모드에서 두 날짜가 모두 없으면 null(조회 보류). */
function buildParams(mode: Mode, month: string, from: string, to: string): string | null {
  if (mode === "month") return month ? `?month=${month}` : null
  if (mode === "range") return from && to ? `?from=${from}&to=${to}` : null
  return "" // recent45
}

function formatPremium(v: number | null): string {
  return v == null ? "" : v.toLocaleString("ko-KR")
}

export function ContractListClient() {
  const [mode, setMode] = useState<Mode>("recent45")
  const [month, setMonth] = useState(currentMonthString())
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const [data, setData] = useState<ContractListItem[]>([])
  const [label, setLabel] = useState("최근 45일")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const params = buildParams(mode, month, from, to)

  const load = useCallback(() => {
    if (params === null) return
    setLoading(true)
    setError(null)
    fetch(`/api/car-insurance/contracts${params}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login"
          return null
        }
        return r.json()
      })
      .then((json) => {
        if (!json) return
        if (json.error) {
          setError(json.error)
          return
        }
        setData(json.data ?? [])
        setLabel(json.label ?? "")
      })
      .catch((e) => setError(e?.message ?? "네트워크 오류"))
      .finally(() => setLoading(false))
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  async function handleExport() {
    if (params === null) return
    setExporting(true)
    try {
      const res = await fetch(`/api/car-insurance/contracts/export${params}`)
      if (!res.ok) {
        alert("Excel 내보내기에 실패했습니다")
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition") ?? ""
      const match = cd.match(/filename\*=UTF-8''([^;]+)/)
      const filename = match
        ? decodeURIComponent(match[1])
        : `자동차보험계약_${todayLocalString()}.xlsx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Car className="h-6 w-6" />
          자동차보험 계약 목록
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={mode === "recent45" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("recent45")}
          >
            최근 45일
          </Button>
          <Button
            variant={mode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("month")}
          >
            월별
          </Button>
          <Button
            variant={mode === "range" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("range")}
          >
            기간
          </Button>
        </div>
      </div>

      {mode === "month" && (
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-44"
          />
        </div>
      )}

      {mode === "range" && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
          />
          <span className="text-muted-foreground">~</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-44"
          />
          {params === null && (
            <span className="text-xs text-muted-foreground">시작일·종료일을 모두 선택하세요</span>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span>계약 목록</span>
            <span className="text-sm font-normal text-muted-foreground">({label}, 계약일 기준)</span>
            {!loading && (
              <Badge variant="outline" className="ml-auto">
                {data.length}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">오류: {error}</p>
          ) : data.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              해당 기간에 계약완료 건이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>계약일</TableHead>
                    <TableHead>계약자</TableHead>
                    <TableHead>보험사</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead>차량번호</TableHead>
                    <TableHead className="text-right">가입보험료</TableHead>
                    <TableHead>시작일</TableHead>
                    <TableHead>만기일</TableHead>
                    <TableHead>증권번호</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(c.계약일)}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {c.customer_id ? (
                          <Link
                            href={`/admin/customers/${c.customer_id}`}
                            className="hover:underline"
                          >
                            {c.계약자 || c.고객명 || ""}
                          </Link>
                        ) : (
                          c.계약자 || c.고객명 || ""
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{c.보험사}</TableCell>
                      <TableCell className="whitespace-nowrap">{c.채널}</TableCell>
                      <TableCell className="whitespace-nowrap">{c.차량번호 || ""}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatPremium(c.가입보험료)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c.시작일)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c.만기일)}</TableCell>
                      <TableCell className="whitespace-nowrap">{c.증권번호 || ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && !error && data.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            본사 보고 양식 Excel 내보내기
          </Button>
        </div>
      )}
    </div>
  )
}
