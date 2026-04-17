import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type CustomerWithCar = {
  id: string
  name: string
  birth_date: string | null
  phone: string | null
  gender: string | null
  car_insurance_data: { 갱신일: string | null }[]
}

function getNextRenewalDate(mmdd: string, from: Date): Date {
  const [mm, dd] = mmdd.split("-").map(Number)
  const thisYear = from.getFullYear()
  const renewalThisYear = new Date(thisYear, mm - 1, dd)
  return renewalThisYear < from ? new Date(thisYear + 1, mm - 1, dd) : renewalThisYear
}

export async function GET() {
  try {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const mm = today.getMonth() + 1

    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    const { data: rawWithBirthday } = await supabase
      .from("customers")
      .select("id, name, birth_date, phone, gender, car_insurance_data ( 갱신일 )")
      .not("birth_date", "is", null)
      .order("birth_date")

    const allWithBirthday = (rawWithBirthday as unknown as CustomerWithCar[]) ?? []

    let sangryungilThisMonth = 0

    const upcomingBirthdays = allWithBirthday
      .filter((c) => {
        if (!c.birth_date) return false
        const [, cMm, cDd] = c.birth_date.split("-")
        const thisYear = today.getFullYear()
        const birthdayThisYear = new Date(thisYear, parseInt(cMm) - 1, parseInt(cDd))

        const sangryungil = new Date(birthdayThisYear)
        sangryungil.setDate(sangryungil.getDate() + 60)
        if (sangryungil.getMonth() + 1 === mm) {
          sangryungilThisMonth++
        }

        if (birthdayThisYear < today) birthdayThisYear.setFullYear(thisYear + 1)
        const diffDays = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / 86400000)
        return diffDays >= 0 && diffDays <= 14
      })
      .map((c) => {
        const validInsurances = (c.car_insurance_data ?? []).filter((i) => i.갱신일)
        validInsurances.sort((a, b) => {
          const dateA = getNextRenewalDate(a.갱신일!, today)
          const dateB = getNextRenewalDate(b.갱신일!, today)
          return dateA.getTime() - dateB.getTime()
        })
        const car_renewal_date = validInsurances.length > 0 ? validInsurances[0].갱신일 : null

        return {
          id: c.id,
          name: c.name,
          birth_date: c.birth_date,
          phone: c.phone,
          gender: c.gender,
          car_renewal_date,
        }
      })

    // 갱신일이 MM-DD 형식이므로 전체 조회 후 코드에서 필터링
    const { data: rawCarData } = await supabase
      .from("car_insurance_data")
      .select("갱신일")

    const carData = (rawCarData as unknown as { 갱신일: string | null }[]) ?? []

    const fortyFiveDaysLater = new Date(today)
    fortyFiveDaysLater.setDate(today.getDate() + 45)

    const carRenewal45Count = carData.filter((item) => {
      if (!item.갱신일 || item.갱신일.trim() === "") return false
      const next = getNextRenewalDate(item.갱신일, today)
      return next >= today && next <= fortyFiveDaysLater
    }).length

    return NextResponse.json({
      data: {
        totalCustomers: totalCustomers ?? 0,
        sangryungilThisMonth,
        upcomingBirthdays,
        carRenewal45Count,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "통계를 불러오지 못했습니다" }, { status: 500 })
  }
}
