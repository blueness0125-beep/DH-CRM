import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  parseContractFilter,
  fetchFilteredContracts,
} from "@/lib/services/car-insurance-contracts-query"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = parseContractFilter(searchParams)
    const items = await fetchFilteredContracts(supabase, filter)

    // 화면 목록: 계약일 내림차순(최근 계약완료 건부터)
    items.sort((a, b) => (b.계약일 ?? "").localeCompare(a.계약일 ?? ""))

    return NextResponse.json({ data: items, label: filter.label })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "목록을 불러오지 못했습니다" }, { status: 500 })
  }
}
