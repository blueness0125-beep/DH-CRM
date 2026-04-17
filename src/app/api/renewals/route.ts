import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type CarInsuranceRow = {
  등록번호: string
  고객명: string
  갱신일: string | null
  차량정보: string | null
  연락처: string | null
  상태: string | null
  메모: string | null
  customer_id: string
  customers: { id: string; name: string; phone: string | null } | null
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter")

    const { data: raw, error } = await supabase
      .from("car_insurance_data")
      .select("등록번호, 고객명, 갱신일, 차량정보, 연락처, 상태, 메모, customer_id, customers ( id, name, phone )")

    if (error) throw error

    const data = (raw as unknown as CarInsuranceRow[]).filter(
      (item) => item.갱신일 && item.갱신일.trim() !== ""
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    type ItemWithDate = CarInsuranceRow & { fullRenewalDate: string }
    let items: ItemWithDate[]

    if (filter === "upcoming45") {
      const limit = new Date(today)
      limit.setDate(today.getDate() + 45)

      items = data
        .map((item) => {
          const next = getNextRenewalDate(item.갱신일!, today)
          return { ...item, fullRenewalDate: next.toISOString().split("T")[0] }
        })
        .filter((item) => {
          const d = new Date(item.fullRenewalDate)
          return d >= today && d <= limit
        })

      items.sort((a, b) => a.fullRenewalDate.localeCompare(b.fullRenewalDate))
    } else {
      const year = parseInt(searchParams.get("year") ?? String(today.getFullYear()))
      const month = searchParams.get("month")

      items = data.map((item) => {
        const [mm, dd] = item.갱신일!.split("-")
        return { ...item, fullRenewalDate: `${year}-${mm}-${dd}` }
      })

      if (month) {
        const m = month.padStart(2, "0")
        items = items.filter((item) => item.갱신일!.startsWith(m))
      }

      items.sort((a, b) => {
        const [aMm, aDd] = a.갱신일!.split("-").map(Number)
        const [bMm, bDd] = b.갱신일!.split("-").map(Number)
        if (aMm !== bMm) return aMm - bMm
        return aDd - bDd
      })
    }

    return NextResponse.json({ data: items })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "갱신 목록을 불러오지 못했습니다" }, { status: 500 })
  }
}
