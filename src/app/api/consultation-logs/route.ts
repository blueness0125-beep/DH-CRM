import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ConsultationLogService } from "@/lib/services/consultation-log-service"

export async function GET(request: NextRequest) {
  try {
    const customerId = new URL(request.url).searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ error: "customerId 필수" }, { status: 400 })
    }

    const supabase = await createClient()
    const service = new ConsultationLogService(supabase)
    const logs = await service.getLogs(customerId)

    return NextResponse.json(logs)
  } catch (error) {
    console.error("상담일지 조회 실패:", error)
    return NextResponse.json({ error: "조회 실패" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const customerId = formData.get("customerId") as string
    const content = formData.get("content") as string
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0)

    if (!customerId || !content?.trim()) {
      return NextResponse.json({ error: "필수 입력값 누락" }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "파일은 최대 5개까지 첨부 가능합니다" }, { status: 400 })
    }

    const supabase = await createClient()
    const service = new ConsultationLogService(supabase)
    const log = await service.createLog(customerId, content.trim(), files)

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("상담일지 생성 실패:", error)
    const message = error instanceof Error ? error.message : "생성 실패"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
