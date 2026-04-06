import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FamilyService } from "@/lib/services/family-service"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const service = new FamilyService(supabase)
    await service.deleteRelationship(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/relationships/[id] error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
