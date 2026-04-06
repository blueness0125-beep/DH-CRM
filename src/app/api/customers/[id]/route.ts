import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CustomerService } from "@/lib/services/customer-service"
import { customerUpdateSchema } from "@/lib/validators/customer-schema"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const service = new CustomerService(supabase)
    const customer = await service.getCustomerById(id)

    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error)
    return NextResponse.json({ error: "고객을 찾을 수 없습니다" }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = customerUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = new CustomerService(supabase)
    const customer = await service.updateCustomer(id, parsed.data)

    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error("PUT /api/customers/[id] error:", error)
    return NextResponse.json({ error: "수정에 실패했습니다" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const service = new CustomerService(supabase)
    await service.deleteCustomer(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error)
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 })
  }
}
