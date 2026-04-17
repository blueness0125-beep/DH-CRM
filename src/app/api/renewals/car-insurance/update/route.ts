import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  등록번호: z.string().min(1),
  상태: z.string().nullable().optional(),
  메모: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { 등록번호, ...fields } = schema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (fields.상태 !== undefined) updateData.상태 = fields.상태
    if (fields.메모 !== undefined) updateData.메모 = fields.메모

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "업데이트할 항목이 없습니다" }, { status: 400 })
    }

    const { error } = await supabase
      .from("car_insurance_data")
      .update(updateData)
      .eq("등록번호", 등록번호)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "업데이트에 실패했습니다" }, { status: 500 })
  }
}
