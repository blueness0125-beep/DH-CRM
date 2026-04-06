import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CustomerService } from "@/lib/services/customer-service"
import { customerCreateSchema, customerSearchSchema } from "@/lib/validators/customer-schema"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = customerSearchSchema.safeParse(searchParams)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = new CustomerService(supabase)
    const result = await service.getCustomers(parsed.data)

    return NextResponse.json({
      data: result.data,
      total: result.count,
      page: parsed.data.page,
      limit: parsed.data.limit,
    })
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = customerCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const service = new CustomerService(supabase)
    const customer = await service.createCustomer(parsed.data, user.id)

    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
