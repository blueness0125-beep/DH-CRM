import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: allCustomers, error } = await supabase
      .from("customers")
      .select("*")
      .not("birth_date", "is", null)
      .order("birth_date")

    if (error) {
      throw error
    }

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const thisYear = today.getFullYear()

    const sangryungilCustomers = (allCustomers ?? [])
      .filter((c) => {
        const [, cMm, cDd] = c.birth_date!.split("-")

        const birthdayThisYear = new Date(thisYear, parseInt(cMm) - 1, parseInt(cDd))

        const sangryungil = new Date(birthdayThisYear)
        sangryungil.setDate(sangryungil.getDate() + 60)

        // 생일에 60일을 더한 날의 달이 이번 달과 일치하는지 확인
        return (sangryungil.getMonth() + 1) === currentMonth
      })
      .sort((a, b) => {
        const [, aMm, aDd] = a.birth_date!.split("-")
        const [, bMm, bDd] = b.birth_date!.split("-")
        const aVal = parseInt(aMm) * 100 + parseInt(aDd)
        const bVal = parseInt(bMm) * 100 + parseInt(bDd)
        return aVal - bVal
      })

    return NextResponse.json({ data: sangryungilCustomers })
  } catch (error) {
    console.error("GET /api/customers/sangryungil error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
