import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exportRenewalsToExcel, type RenewalExportRow } from "@/lib/utils/car-insurance-renewals-excel"

function getNextRenewalDate(mmdd: string, from: Date): Date {
  const [mm, dd] = mmdd.split("-").map(Number)
  const thisYear = from.getFullYear()
  const renewalThisYear = new Date(thisYear, mm - 1, dd)
  return renewalThisYear < from ? new Date(thisYear + 1, mm - 1, dd) : renewalThisYear
}

type Row = {
  고객명: string
  갱신일: string | null
  생년월일: string | null
  주민번호뒷자리: string | null
  customers: {
    name: string
    birth_date: string | null
    ssn_back: string | null
    customer_type: "individual" | "corporate" | null
    business_number: string | null
  } | null
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") ?? "upcoming45"

    const { data: raw, error } = await supabase
      .from("car_insurance_data")
      .select(
        "고객명, 갱신일, 생년월일, 주민번호뒷자리, customers ( name, birth_date, ssn_back, customer_type, business_number )"
      )

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let items: RenewalExportRow[] = ((raw as unknown as Row[]) ?? []).map((item) => {
      const isBizNoPattern = /^\d{3}-\d{2}-\d{5}$/.test((item.customers?.business_number || item.생년월일 || "").trim())
      const isCorporate =
        item.customers?.customer_type === "corporate" ||
        !!item.customers?.business_number ||
        isBizNoPattern

      const birthVal = isCorporate
        ? (item.customers?.business_number || item.생년월일 || "")
        : (item.customers?.birth_date || item.생년월일 || "")

      const ssnVal = isCorporate ? "" : (item.customers?.ssn_back || item.주민번호뒷자리 || "")

      return {
        성명: item.customers?.name || item.고객명 || "",
        갱신일: item.갱신일,
        생년월일: birthVal,
        주민번호뒷자리: ssnVal,
        isCorporate,
        fullRenewalDate: item.갱신일?.trim()
          ? getNextRenewalDate(item.갱신일, today).toISOString().split("T")[0]
          : "",
      }
    })

    let sheetName = "자동차보험 갱신"
    if (filter === "upcoming45") {
      const limit = new Date(today)
      limit.setDate(today.getDate() + 45)
      items = items.filter((item) => {
        if (!item.fullRenewalDate) return false
        const d = new Date(item.fullRenewalDate)
        return d >= today && d <= limit
      })
      sheetName = "45일 이내 갱신"
    } else if (filter.startsWith("month:")) {
      const m = filter.split(":")[1].padStart(2, "0")
      items = items.filter((item) => item.갱신일?.startsWith(m))
      sheetName = `${Number(m)}월 갱신`
    }

    items.sort((a, b) => {
      if (!a.fullRenewalDate) return 1
      if (!b.fullRenewalDate) return -1
      return a.fullRenewalDate.localeCompare(b.fullRenewalDate)
    })

    const buffer = await exportRenewalsToExcel(items, sheetName)
    const todayStr = today.toISOString().slice(0, 10)
    const filterTag =
      filter === "upcoming45"
        ? "45일이내"
        : filter.startsWith("month:")
          ? `${Number(filter.split(":")[1])}월`
          : "전체"
    const filename = `자동차보험갱신_${filterTag}_${todayStr}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "내보내기에 실패했습니다" }, { status: 500 })
  }
}
