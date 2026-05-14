import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CarInsuranceRegistrationService } from "@/lib/services/car-insurance-registration-service"
import { carInsuranceRegistrationSchema } from "@/lib/validators/car-insurance-registration-schema"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = carInsuranceRegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = new CarInsuranceRegistrationService(supabase)
    const result = await service.register(parsed.data)

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error("POST /api/car-insurance/register error:", error)
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
