"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  CalendarDays,
  UserPlus,
  Cake,
  Phone,
  ArrowRight,
  Upload,
  TrendingUp,
  Gift,
} from "lucide-react"
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

function getInitials(name: string): string {
  return name.length >= 2 ? name.slice(-2) : name
}

function getUrgencyStyle(days: number): {
  badge: string
  avatar: string
  label: string
} {
  if (days === 0)
    return {
      badge: "bg-red-100 text-red-700 border-red-200",
      avatar: "bg-red-500 text-white",
      label: "오늘",
    }
  if (days <= 3)
    return {
      badge: "bg-orange-100 text-orange-700 border-orange-200",
      avatar: "bg-orange-400 text-white",
      label: `D-${days}`,
    }
  if (days <= 7)
    return {
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      avatar: "bg-amber-400 text-white",
      label: `D-${days}`,
    }
  return {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    avatar: "bg-blue-400 text-white",
    label: `D-${days}`,
  }
}

function formatGreetingDate(): string {
  const now = new Date()
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
  const month = now.getMonth() + 1
  const date = now.getDate()
  const day = days[now.getDay()]
  return `${month}월 ${date}일 ${day}`
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

  const todayBirthdays =
    stats?.upcomingBirthdays.filter((c) => daysUntilBirthday(c.birth_date) === 0) ?? []
  const otherBirthdays =
    stats?.upcomingBirthdays.filter((c) => daysUntilBirthday(c.birth_date) > 0) ?? []

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{formatGreetingDate()}</p>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        </div>
        <Link href="/admin/customers/new">
          <Button className="mt-2 sm:mt-0" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            고객 등록
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="전체 고객"
          value={stats?.totalCustomers}
          loading={loading}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          href="/admin/customers"
          suffix="명"
        />
        <KpiCard
          title="이번 달 생일"
          value={stats?.birthdayThisMonth}
          loading={loading}
          icon={<Cake className="h-5 w-5 text-pink-600" />}
          iconBg="bg-pink-50"
          suffix="명"
        />
        <KpiCard
          title="14일 내 생일"
          value={stats?.upcomingBirthdays.length}
          loading={loading}
          icon={<Gift className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-50"
          suffix="명"
          highlight={!!stats?.upcomingBirthdays.length}
        />
        <KpiCard
          title="최근 7일 신규"
          value={stats?.recentCount}
          loading={loading}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          suffix="명"
          href="/admin/customers"
        />
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Birthday List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              다가오는 생일
              {stats?.upcomingBirthdays.length ? (
                <Badge variant="secondary" className="text-xs">
                  {stats.upcomingBirthdays.length}명
                </Badge>
              ) : null}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !stats?.upcomingBirthdays.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <Cake className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">14일 내 생일인 고객이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 오늘 생일 */}
              {todayBirthdays.map((c) => {
                const style = getUrgencyStyle(0)
                return (
                  <BirthdayRow key={c.id} customer={c} days={0} style={style} />
                )
              })}
              {/* 나머지 */}
              {otherBirthdays.map((c) => {
                const days = daysUntilBirthday(c.birth_date)
                const style = getUrgencyStyle(days)
                return (
                  <BirthdayRow key={c.id} customer={c} days={days} style={style} />
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div>
            <h2 className="mb-3 text-base font-semibold">빠른 메뉴</h2>
            <div className="space-y-2">
              <QuickAction
                href="/admin/customers/new"
                icon={<UserPlus className="h-4 w-4 text-blue-600" />}
                iconBg="bg-blue-50"
                label="고객 등록"
                desc="새 고객 정보 추가"
              />
              <QuickAction
                href="/admin/customers"
                icon={<Users className="h-4 w-4 text-slate-600" />}
                iconBg="bg-slate-100"
                label="고객 목록"
                desc="전체 고객 조회"
              />
              <QuickAction
                href="/admin/customers/import"
                icon={<Upload className="h-4 w-4 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="엑셀 임포트"
                desc="대량 고객 업로드"
              />
              <QuickAction
                href="/admin/renewals"
                icon={<CalendarDays className="h-4 w-4 text-purple-600" />}
                iconBg="bg-purple-50"
                label="갱신 관리"
                desc="보험 갱신 일정"
              />
            </div>
          </div>

          {/* This Month Summary */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              이번 달 현황
            </h2>
            <div className="space-y-3">
              <SummaryRow
                label="이번 달 생일"
                value={loading ? null : stats?.birthdayThisMonth ?? 0}
                unit="명"
                color="text-pink-600"
              />
              <SummaryRow
                label="14일 내 생일"
                value={loading ? null : stats?.upcomingBirthdays.length ?? 0}
                unit="명"
                color="text-purple-600"
              />
              <SummaryRow
                label="오늘 생일"
                value={loading ? null : todayBirthdays.length}
                unit="명"
                color="text-red-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────── */

function KpiCard({
  title,
  value,
  icon,
  iconBg,
  loading,
  href,
  suffix = "",
  highlight = false,
}: {
  title: string
  value?: number
  icon: React.ReactNode
  iconBg: string
  loading: boolean
  href?: string
  suffix?: string
  highlight?: boolean
}) {
  const inner = (
    <div
      className={`rounded-xl border bg-card p-5 transition-colors ${
        href ? "cursor-pointer hover:bg-muted/40" : ""
      } ${highlight ? "ring-2 ring-purple-200" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">
            {value?.toLocaleString() ?? "-"}
            {value != null && suffix && (
              <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>
            )}
          </p>
        )}
      </div>
      {href && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span>보러가기</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

function BirthdayRow({
  customer,
  days,
  style,
}: {
  customer: UpcomingBirthday
  days: number
  style: { badge: string; avatar: string; label: string }
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/30">
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.avatar}`}
      >
        {getInitials(customer.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="block truncate text-sm font-semibold hover:underline"
        >
          {customer.name}
        </Link>
        <p className="text-xs text-muted-foreground">{customer.birth_date}</p>
      </div>

      {/* D-day badge */}
      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
        {style.label}
      </span>

      {/* Call button */}
      {customer.phone ? (
        <a href={`tel:${customer.phone}`} className="shrink-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
            <Phone className="h-3 w-3" />
            <span className="hidden sm:inline">{formatPhone(customer.phone)}</span>
            <span className="sm:hidden">전화</span>
          </Button>
        </a>
      ) : (
        <div className="w-8 shrink-0" />
      )}
    </div>
  )
}

function QuickAction({
  href,
  icon,
  iconBg,
  label,
  desc,
}: {
  href: string
  icon: React.ReactNode
  iconBg: string
  label: string
  desc: string
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  )
}

function SummaryRow({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number | null
  unit: string
  color: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value === null ? (
        <Skeleton className="h-4 w-12" />
      ) : (
        <span className={`text-sm font-bold ${color}`}>
          {value.toLocaleString()}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
      )}
    </div>
  )
}
