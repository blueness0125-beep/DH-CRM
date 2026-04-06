"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Phone, Car } from "lucide-react"
import { formatPhone } from "@/lib/utils/format"

type RenewalItem = {
  id: string
  car_number: string | null
  insurance_company: string | null
  expiry_date: string
  premium: number | null
  memo: string | null
  customer_id: string
  customers: {
    id: string
    name: string
    phone: string | null
  } | null
}

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]

function urgencyBadge(expiryDate: string) {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return <Badge variant="destructive">만료됨</Badge>
  if (diffDays <= 7) return <Badge className="bg-red-500 text-white">D-{diffDays}</Badge>
  if (diffDays <= 30) return <Badge className="bg-yellow-500 text-white">D-{diffDays}</Badge>
  return <Badge variant="outline" className="text-blue-600 border-blue-300">D-{diffDays}</Badge>
}

export function RenewalsClient() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1)
  const [data, setData] = useState<RenewalItem[]>([])
  const [monthlyCounts, setMonthlyCounts] = useState<number[]>(Array(12).fill(0))
  const [loading, setLoading] = useState(true)

  // 연간 전체 로드 (월별 카운트용)
  useEffect(() => {
    const params = new URLSearchParams({ year: String(year) })
    fetch(`/api/renewals?${params}`)
      .then((r) => r.json())
      .then((json) => {
        const items: RenewalItem[] = json.data ?? []
        const counts = Array(12).fill(0)
        items.forEach((item) => {
          const m = new Date(item.expiry_date).getMonth()
          counts[m]++
        })
        setMonthlyCounts(counts)
      })
      .catch(() => {})
  }, [year])

  // 선택된 월 로드
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ year: String(year) })
    if (selectedMonth) params.set("month", String(selectedMonth))
    fetch(`/api/renewals?${params}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, selectedMonth])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">갱신 관리</h1>

      {/* 연도 선택 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold w-16 text-center">{year}년</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 월별 캘린더 그리드 */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {MONTHS.map((label, idx) => {
          const m = idx + 1
          const count = monthlyCounts[idx]
          const isSelected = selectedMonth === m
          const isCurrent = year === today.getFullYear() && m === today.getMonth() + 1
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(isSelected ? null : m)}
              className={`relative flex flex-col items-center rounded-lg border p-2 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCurrent
                  ? "border-primary/50 bg-primary/10"
                  : "hover:bg-muted"
              }`}
            >
              <span className="font-medium">{label}</span>
              {count > 0 && (
                <span className={`text-xs font-bold ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
                  {count}건
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            {selectedMonth ? `${year}년 ${selectedMonth}월 갱신 예정` : `${year}년 전체`}
            {!loading && <Badge variant="outline" className="ml-auto">{data.length}건</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              갱신 예정 건이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.customers && (
                          <Link
                            href={`/admin/customers/${item.customers.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {item.customers.name}
                          </Link>
                        )}
                        {item.car_number && (
                          <span className="text-xs text-muted-foreground">{item.car_number}</span>
                        )}
                        {item.insurance_company && (
                          <Badge variant="secondary" className="text-xs">{item.insurance_company}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        만기: {item.expiry_date}
                        {item.premium != null && ` · ${item.premium.toLocaleString()}원`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {urgencyBadge(item.expiry_date)}
                    {item.customers?.phone && (
                      <a href={`tel:${item.customers.phone}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          <Phone className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">{formatPhone(item.customers.phone)}</span>
                          <span className="sm:hidden">전화</span>
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
