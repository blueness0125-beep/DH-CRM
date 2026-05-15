import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const contractSchema = z.object({
  car_insurance_id: z.string().min(1),
  계약일: z.string().min(1),
  보험사: z.string().min(1),
  채널: z.string().min(1),
  가입보험료: z.number().int().nonnegative().nullable(),
  차량번호: z.string().nullable(),
  차대번호: z.string().nullable().optional(),
  증권번호: z.string().nullable(),
  시작일: z.string().nullable(),
  만기일: z.string().nullable(),
  피보험자: z.string().nullable(),
  계약자: z.string().nullable(),
  설계자: z.string().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = contractSchema.parse(body)

    const { data, error } = await supabase
      .from("car_insurance_contracts")
      .insert(parsed)
      .select()
      .single()

    if (error) throw error

    // 첫 계약 추가 시 상태를 "완료"로 자동 변경
    const { data: existing } = await supabase
      .from("car_insurance_contracts")
      .select("id")
      .eq("car_insurance_id", parsed.car_insurance_id)

    if ((existing?.length ?? 0) <= 1) {
      await supabase
        .from("car_insurance_data")
        .update({ 상태: "완료" } as Record<string, unknown>)
        .eq("등록번호", parsed.car_insurance_id)
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다", details: e.issues }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "저장에 실패했습니다" }, { status: 500 })
  }
}
