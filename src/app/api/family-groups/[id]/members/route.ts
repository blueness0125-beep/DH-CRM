import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FamilyService } from "@/lib/services/family-service"
import { familyGroupAddMemberSchema } from "@/lib/validators/relationship-schema"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const parsed = familyGroupAddMemberSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const service = new FamilyService(supabase)
    await service.addFamilyMember(id, parsed.data.customer_id)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("POST /api/family-groups/[id]/members error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { customer_id } = await request.json()
    if (!customer_id) return NextResponse.json({ error: "customer_id 필요" }, { status: 400 })

    const service = new FamilyService(supabase)
    await service.removeFamilyMember(customer_id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/family-groups/[id]/members error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
