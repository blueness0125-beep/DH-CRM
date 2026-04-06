import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")

    // 전체 고객 수
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    // 이번 달 생일 고객 수 (월/일 기준)
    const { count: birthdayThisMonth } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .filter("birth_date", "not.is", null)
      .like("birth_date", `%-${mm}-%`)

    // 14일 내 생일 고객 목록
    const { data: allWithBirthday } = await supabase
      .from("customers")
      .select("id, name, birth_date, phone, gender")
      .filter("birth_date", "not.is", null)
      .order("birth_date")

    const upcomingBirthdays = (allWithBirthday ?? []).filter((c) => {
      if (!c.birth_date) return false
      const [, cMm, cDd] = c.birth_date.split("-")
      const thisYear = today.getFullYear()
      const birthdayThisYear = new Date(thisYear, parseInt(cMm) - 1, parseInt(cDd))
      // 작년이면 내년으로
      if (birthdayThisYear < today) birthdayThisYear.setFullYear(thisYear + 1)
      const diffDays = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / 86400000)
      return diffDays >= 0 && diffDays <= 14
    })

    // 최근 7일 내 등록 고객 수
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    const { count: recentCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    return NextResponse.json({
      data: {
        totalCustomers: totalCustomers ?? 0,
        birthdayThisMonth: birthdayThisMonth ?? 0,
        upcomingBirthdays,
        recentCount: recentCount ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: "통계를 불러오지 못했습니다" }, { status: 500 })
  }
}
