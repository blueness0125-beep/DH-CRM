import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parsedRowToCustomerCreate } from "@/lib/utils/excel-parser"
import type { ParsedRow } from "@/lib/utils/excel-parser"

type ImportRequestBody = {
  rows: ParsedRow[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body: ImportRequestBody = await req.json()
    const { rows } = body

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "가져올 데이터가 없습니다" }, { status: 400 })
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      try {
        // 이름 + 전화번호로 중복 확인
        if (row.phone) {
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("name", row.name)
            .eq("phone", row.phone)
            .maybeSingle()

          if (existing) {
            results.skipped++
            continue
          }
        }

        const payload = parsedRowToCustomerCreate(row)
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, created_by: user?.id })

        if (error) {
          results.errors.push(`행 ${row.rowIndex} (${row.name}): ${error.message}`)
        } else {
          results.created++
        }
      } catch (err) {
        results.errors.push(`행 ${row.rowIndex} (${row.name}): 처리 중 오류`)
      }
    }

    return NextResponse.json({ data: results })
  } catch (err) {
    return NextResponse.json({ error: "임포트에 실패했습니다" }, { status: 500 })
  }
}
