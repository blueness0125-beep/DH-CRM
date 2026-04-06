"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, CalendarDays, UserPlus, Cake, Phone } from "lucide-react"
import { formatPhone } from "@/lib/utils/format"

type UpcomingBirthday = {
  id: string
  name: string
  birth_date: string
  phone: string | null
  gender: string | null
}

type DashboardStats = {
  totalCustomers: number
  birthdayThisMonth: number
  upcomingBirthdays: UpcomingBirthday[]
  recentCount: number
}

function daysUntilBirthday(birthDate: string): number {
  const today = new Date()
  const [, mm, dd] = birthDate.split("-")
  const thisYear = today.getFullYear()
  const next = new Date(thisYear, parseInt(mm) - 1, parseInt(dd))
  if (next < today) next.setFullYear(thisYear + 1)
  return Math.ceil((next.getTime() - today.getTime()) / 86400000)
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((json) => setStats(json.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 고객"
          value={stats?.totalCustomers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
          href="/admin/customers"
        />
        <StatCard
          title="이번 달 생일"
          value={stats?.birthdayThisMonth}
          icon={<Cake className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
          suffix="명"
        />
        <StatCard
          title="14일 내 생일"
          value={stats?.upcomingBirthdays.length}
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
          suffix="명"
        />
        <StatCard
          title="최근 7일 등록"
          value={stats?.recentCount}
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
          suffix="명"
        />
      </div>

      {/* 다가오는 생일 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cake className="h-4 w-4" />
            다가오는 생일 (14일 이내)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !stats?.upcomingBirthdays.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              14일 내 생일인 고객이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingBirthdays.map((c) => {
                const days = daysUntilBirthday(c.birth_date)
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        days === 0
                          ? "bg-red-100 text-red-700"
                          : days <= 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {days === 0 ? "오늘" : `D-${days}`}
                      </div>
                      <div>
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{c.birth_date}</p>
                      </div>
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          <Phone className="mr-1.5 h-3 w-3" />
                          {formatPhone(c.phone)}
                        </Button>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 메뉴 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/customers/new">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 p-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">고객 등록</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/customers/import">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">엑셀 임포트</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/customers">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">고객 목록</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  loading,
  href,
  suffix = "",
}: {
  title: string
  value?: number
  icon: React.ReactNode
  loading: boolean
  href?: string
  suffix?: string
}) {
  const content = (
    <Card className={href ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">
            {value?.toLocaleString() ?? "-"}
            {value != null && suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
