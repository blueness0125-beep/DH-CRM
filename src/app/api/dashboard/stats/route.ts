import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const today = new Date()
    const mm = today.getMonth() + 1

    // 전체 고객 수
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    // 14일 내 생일 및 상령일 계산을 위해 생일이 있는 모든 고객 조회 (최신 자동차보험 갱신일 포함)
    // car_insurances에서 가장 최근의(만료일 기준) 하나만 가져올 수 없으므로 전체 가져와서 가공
    const { data: allWithBirthday } = await supabase
      .from("customers")
      .select(`
        id, 
        name, 
        birth_date, 
        phone, 
        gender,
        car_insurances ( expiry_date )
      `)
      .not("birth_date", "is", null)
      .order("birth_date")

    let sangryungilThisMonth = 0
    
    const upcomingBirthdays = (allWithBirthday ?? []).filter((c) => {
      if (!c.birth_date) return false
      const [, cMm, cDd] = c.birth_date.split("-")
      const thisYear = today.getFullYear()
      const birthdayThisYear = new Date(thisYear, parseInt(cMm) - 1, parseInt(cDd))
      
      // 이번 달 상령일 (생일 + 60일) 계산
      const sangryungil = new Date(birthdayThisYear)
      sangryungil.setDate(sangryungil.getDate() + 60)
      if (sangryungil.getMonth() + 1 === mm) {
        sangryungilThisMonth++
      }

      // 14일 내 생일 계산
      if (birthdayThisYear < today) birthdayThisYear.setFullYear(thisYear + 1)
      const diffDays = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / 86400000)
      return diffDays >= 0 && diffDays <= 14
    }).map(c => {
      // car_insurances 중 expiry_date가 있는 것들을 모아 내림차순(또는 가장 임박한 순) 정렬 가능.
      // 여기서는 가장 나중의 갱신일(최신 만기) 또는 단순히 첫번째 값을 표시
      const validInsurances = (c.car_insurances as any[] ?? []).filter(i => i.expiry_date)
      validInsurances.sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime())
      const car_renewal_date = validInsurances.length > 0 ? validInsurances[0].expiry_date : null

      return {
        id: c.id,
        name: c.name,
        birth_date: c.birth_date,
        phone: c.phone,
        gender: c.gender,
        car_renewal_date
      }
    })

    // 최근 7일 내 대신 -> 45일 이내 자동차보험 갱신 대상자 수 계산
    const fortyFiveDaysLater = new Date(today)
    fortyFiveDaysLater.setDate(today.getDate() + 45)
    
    // YYYY-MM-DD 형식으로 포맷팅
    const todayStr = today.toISOString().split('T')[0]
    const limitStr = fortyFiveDaysLater.toISOString().split('T')[0]

    const { count: carRenewal45Count } = await supabase
      .from("car_insurances")
      .select("*", { count: "exact", head: true })
      .gte("expiry_date", todayStr)
      .lte("expiry_date", limitStr)

    return NextResponse.json({
      data: {
        totalCustomers: totalCustomers ?? 0,
        sangryungilThisMonth,
        upcomingBirthdays,
        carRenewal45Count: carRenewal45Count ?? 0,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "통계를 불러오지 못했습니다" }, { status: 500 })
  }
}
