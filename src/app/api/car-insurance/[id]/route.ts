import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CarInsuranceRegistrationService } from "@/lib/services/car-insurance-registration-service"
import { carInsuranceUpdateSchema } from "@/lib/validators/car-insurance-registration-schema"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const service = new CarInsuranceRegistrationService(supabase)
    const data = await service.findByRegistrationId(id)
    return NextResponse.json({ data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "자동차보험 정보를 찾을 수 없습니다" }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    // FK cascade가 명확치 않으므로 contracts 먼저 명시적으로 삭제
    const { error: contractError } = await supabase
      .from("car_insurance_contracts")
      .delete()
      .eq("car_insurance_id", id)
    if (contractError) throw contractError

    const { error } = await supabase
      .from("car_insurance_data")
      .delete()
      .eq("등록번호", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = carInsuranceUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = new CarInsuranceRegistrationService(supabase)
    const data = await service.update(id, parsed.data)
    return NextResponse.json({ data })
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : "수정에 실패했습니다"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
