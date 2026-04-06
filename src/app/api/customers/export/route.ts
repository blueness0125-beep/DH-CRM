import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exportCustomersToExcel } from "@/lib/utils/excel-exporter"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") ?? ""

    let queryBuilder = supabase.from("customers").select("*").order("name")

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,phone.ilike.%${query}%`
      )
    }

    const { data, error } = await queryBuilder
    if (error) throw error

    const buffer = await exportCustomersToExcel(data ?? [])

    const filename = `고객목록_${new Date().toISOString().slice(0, 10)}.xlsx`
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch {
    return NextResponse.json({ error: "내보내기에 실패했습니다" }, { status: 500 })
  }
}
