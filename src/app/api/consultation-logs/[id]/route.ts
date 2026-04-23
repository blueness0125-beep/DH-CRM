import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ConsultationLogService } from "@/lib/services/consultation-log-service"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const service = new ConsultationLogService(supabase)
    await service.deleteLog(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("상담일지 삭제 실패:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
}
