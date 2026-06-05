import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  parseContractFilter,
  fetchFilteredContracts,
} from "@/lib/services/car-insurance-contracts-query"
import { exportContractsToExcel } from "@/lib/utils/car-insurance-contracts-excel"

function todayLocalString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

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

    // 엑셀: 계약일 오름차순(순정렬)
    items.sort((a, b) => (a.계약일 ?? "").localeCompare(b.계약일 ?? ""))

    const buffer = await exportContractsToExcel(items, "자동차보험 계약")
    const filename = `자동차보험계약_${filter.tag}_${todayLocalString()}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "내보내기에 실패했습니다" }, { status: 500 })
  }
}
