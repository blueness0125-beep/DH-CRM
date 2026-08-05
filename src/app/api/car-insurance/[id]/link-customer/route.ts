import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CarInsuranceRegistrationService } from "@/lib/services/car-insurance-registration-service"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { customer_id } = body

    if (!customer_id) {
      return NextResponse.json({ error: "고객 ID(customer_id)가 필요합니다" }, { status: 400 })
    }

    const service = new CarInsuranceRegistrationService(supabase)
    const data = await service.linkCustomer(id, customer_id)

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error("POST /api/car-insurance/[id]/link-customer error:", e)
    const message = e instanceof Error ? e.message : "고객 연결에 실패했습니다"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
