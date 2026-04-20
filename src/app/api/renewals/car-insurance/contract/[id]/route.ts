import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const updateSchema = z.object({
  계약일: z.string().min(1),
  보험사: z.string().min(1),
  채널: z.string().min(1),
  가입보험료: z.number().int().nonnegative().nullable(),
  차량번호: z.string().nullable(),
  증권번호: z.string().nullable(),
  시작일: z.string().nullable(),
  만기일: z.string().nullable(),
  피보험자: z.string().nullable(),
  계약자: z.string().nullable(),
  설계자: z.string().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const { data, error } = await supabase
      .from("car_insurance_contracts")
      .update(parsed)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다", details: e.issues }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "수정에 실패했습니다" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { error } = await supabase
      .from("car_insurance_contracts")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 })
  }
}
