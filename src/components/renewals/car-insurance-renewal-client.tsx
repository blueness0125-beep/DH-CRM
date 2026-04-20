"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, ChevronDown, ChevronUp, Phone } from "lucide-react"
import { CarInsuranceDetail } from "./car-insurance-detail"
import { formatPhone } from "@/lib/utils/format"
import type { CarInsuranceEntry } from "@/app/api/renewals/car-insurance/route"
import { cn } from "@/lib/utils"

/** 모바일에서만 표시되는 갱신 관리 서브탭 (PC는 사이드바가 담당) */
const SUB_TABS = [
  { label: "일반 갱신", href: "/admin/renewals" },
  { label: "자동차보험 갱신", href: "/admin/renewals/car-insurance" },
]

function MobileSubTabs() {
  return (
    <div className="flex rounded-lg border overflow-hidden md:hidden">
      {SUB_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex-1 py-2 text-center text-sm font-medium transition-colors",
            // 현재 페이지는 /admin/renewals/car-insurance 이므로 자동차보험 탭이 활성
            tab.href === "/admin/renewals/car-insurance"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

const FILTERS = [
  { label: "45일 이내", value: "upcoming45" },
  { label: "이번 달", value: `month:${String(new Date().getMonth() + 1).padStart(2, "0")}` },
  { label: "전체", value: "all" },
]

function urgencyBadge(fullRenewalDate: string) {
  if (!fullRenewalDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(fullRenewalDate)
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return <Badge variant="destructive">만료</Badge>
  if (diff === 0) return <Badge className="bg-red-600 text-white">D-0</Badge>
  if (diff <= 7) return <Badge className="bg-red-500 text-white">D-{diff}</Badge>
  if (diff <= 30) return <Badge className="bg-yellow-500 text-white">D-{diff}</Badge>
  return <Badge variant="outline" className="text-blue-600 border-blue-300">D-{diff}</Badge>
}

export function CarInsuranceRenewalClient() {
  const [activeFilter, setActiveFilter] = useState("upcoming45")
  const [data, setData] = useState<CarInsuranceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = activeFilter === "all" ? "" : `?filter=${activeFilter}`
    fetch(`/api/renewals/car-insurance${params}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return null }
        return r.json()
      })
      .then((json) => {
        if (!json) return
        if (json.error) { setError(json.error); return }
        setData(json.data ?? [])
      })
      .catch((e) => setError(e?.message ?? "네트워크 오류"))
      .finally(() => setLoading(false))
  }, [activeFilter])

  useEffect(() => { load() }, [load])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* 모바일 전용 서브탭: PC에서는 사이드바 하위 메뉴로 대체됨 */}
      <MobileSubTabs />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Car className="h-6 w-6" />
          자동차보험 갱신
        </h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={activeFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            갱신 목록
            {!loading && (
              <Badge variant="outline" className="ml-auto">{data.length}건</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">
              오류: {error}
            </p>
          ) : data.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              해당 기간에 갱신 대상이 없습니다
            </p>
          ) : (
            <div>
              {data.map((item) => {
                const isExpanded = expandedId === item.등록번호
                const phone = item.customers?.phone || item.연락처
                const hasContract = (item.car_insurance_contracts?.length ?? 0) > 0
                const vehicleSummary = item.차량정보?.split("\n")[0] ?? ""

                return (
                  <div key={item.등록번호} className="border-b last:border-b-0">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => toggleExpand(item.등록번호)}
                    >
                      {/* 갱신일 */}
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-sm font-bold text-primary">{item.갱신일}</p>
                      </div>

                      {/* 고객정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.customers ? (
                            <Link
                              href={`/admin/customers/${item.customers.id}`}
                              className="text-sm font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.customers.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium">{item.고객명}</span>
                          )}
                          {item.상태 && (
                            <Badge variant="secondary" className="text-xs">{item.상태}</Badge>
                          )}
                          {hasContract && (
                            <Badge className="text-xs bg-green-600 text-white">계약완료</Badge>
                          )}
                        </div>
                        {vehicleSummary && (
                          <p className="text-xs text-muted-foreground truncate">{vehicleSummary}</p>
                        )}
                      </div>

                      {/* 우측 액션 */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.fullRenewalDate && urgencyBadge(item.fullRenewalDate)}
                        {phone && (
                          <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Phone className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <CarInsuranceDetail
                        entry={item}
                        onContractSaved={load}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
