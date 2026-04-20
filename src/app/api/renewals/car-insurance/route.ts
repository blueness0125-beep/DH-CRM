import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CarInsuranceContract } from "@/types/car-insurance"

export type { CarInsuranceContract }

export type CarInsuranceEntry = {
  등록번호: string
  고객명: string
  갱신일: string | null
  차량정보: string | null
  연락처: string | null
  상태: string | null
  메모: string | null
  비교내용: string | null
  비교표경로: string | null
  가입정보경로: string | null
  이미지경로: string | null
  customer_id: string | null
  customers: { id: string; name: string; phone: string | null } | null
  car_insurance_contracts: CarInsuranceContract[]
  fullRenewalDate: string
}

function getNextRenewalDate(mmdd: string, from: Date): Date {
  const [mm, dd] = mmdd.split("-").map(Number)
  const thisYear = from.getFullYear()
  const renewalThisYear = new Date(thisYear, mm - 1, dd)
  return renewalThisYear < from ? new Date(thisYear + 1, mm - 1, dd) : renewalThisYear
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter")

    const { data: raw, error } = await supabase
      .from("car_insurance_data")
      .select("*, customers ( id, name, phone ), car_insurance_contracts ( * )")

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let items = ((raw as unknown as CarInsuranceEntry[]) ?? []).map((item) => ({
      ...item,
      car_insurance_contracts: item.car_insurance_contracts ?? [],
      fullRenewalDate: item.갱신일?.trim()
        ? getNextRenewalDate(item.갱신일, today).toISOString().split("T")[0]
        : "",
    }))

    if (filter === "upcoming45") {
      const limit = new Date(today)
      limit.setDate(today.getDate() + 45)
      items = items.filter((item) => {
        if (!item.fullRenewalDate) return false
        const d = new Date(item.fullRenewalDate)
        return d >= today && d <= limit
      })
    } else if (filter?.startsWith("month:")) {
      const m = filter.split(":")[1].padStart(2, "0")
      items = items.filter((item) => item.갱신일?.startsWith(m))
    }

    items.sort((a, b) => {
      if (!a.fullRenewalDate) return 1
      if (!b.fullRenewalDate) return -1
      return a.fullRenewalDate.localeCompare(b.fullRenewalDate)
    })

    return NextResponse.json({ data: items })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "목록을 불러오지 못했습니다" }, { status: 500 })
  }
}
