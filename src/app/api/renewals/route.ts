import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year") ?? new Date().getFullYear().toString()
    const month = searchParams.get("month") // null이면 연간 전체

    let query = supabase
      .from("car_insurances")
      .select(`
        id,
        car_number,
        insurance_company,
        expiry_date,
        premium,
        memo,
        customer_id,
        customers ( id, name, phone )
      `)
      .not("expiry_date", "is", null)
      .order("expiry_date")

    if (month) {
      const mm = month.padStart(2, "0")
      query = query
        .gte("expiry_date", `${year}-${mm}-01`)
        .lte("expiry_date", `${year}-${mm}-31`)
    } else {
      query = query
        .gte("expiry_date", `${year}-01-01`)
        .lte("expiry_date", `${year}-12-31`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: "갱신 목록을 불러오지 못했습니다" }, { status: 500 })
  }
}
