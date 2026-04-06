import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FamilyService } from "@/lib/services/family-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const service = new FamilyService(supabase)
    const relationships = await service.getRelationships(id)

    return NextResponse.json({ data: relationships })
  } catch (error) {
    console.error("GET /api/customers/[id]/relationships error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
