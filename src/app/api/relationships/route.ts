import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FamilyService } from "@/lib/services/family-service"
import { relationshipCreateSchema } from "@/lib/validators/relationship-schema"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = relationshipCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const service = new FamilyService(supabase)
    const relationship = await service.createRelationship(parsed.data)

    return NextResponse.json({ data: relationship }, { status: 201 })
  } catch (error) {
    console.error("POST /api/relationships error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
