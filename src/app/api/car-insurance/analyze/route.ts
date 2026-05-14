import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"
import { geminiExtractResultSchema } from "@/lib/validators/car-insurance-registration-schema"

export const runtime = "nodejs"
export const maxDuration = 60

const PROMPT = `이 이미지에서 자동차 보험 가입 정보를 추출해서 JSON 리스트 형식으로 응답해줘.
차량이 여러 대라면 각각의 객체로 만들어줘.
결과에는 다음 필드가 반드시 포함되어야 해:
- 피보험자: 이름만 추출 (예: '전세진(850228-2******)' 이라면 '전세진'만 추출)
- 생년월일: YYYY-MM-DD 형식 (이미지에 850228 형식이면 1985-02-28로 변환. 주민번호 앞자리 참고)
- 유효일자: 보험 만기일 (MM-DD 형식으로 추출, 예: 03-15)
- 차량번호
- 가입사
- 보험종목
- 가입담보
- 연령한정_운전자
JSON 데이터 외의 다른 텍스트는 포함하지 마.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { imageBase64, mimeType } = body as { imageBase64?: string; mimeType?: string }
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64가 필요합니다" }, { status: 400 })
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",", 2)[1] : imageBase64

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        { text: PROMPT },
        { inlineData: { mimeType: mimeType || "image/png", data: cleanBase64 } },
      ],
    })

    const text = response.text ?? ""
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      return NextResponse.json({ data: [], raw: text })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(match[0])
    } catch {
      return NextResponse.json({ data: [], raw: text })
    }

    const validated = geminiExtractResultSchema.safeParse(parsed)
    if (!validated.success) {
      return NextResponse.json({ data: [], raw: text, warning: "schema mismatch" })
    }

    return NextResponse.json({ data: validated.data })
  } catch (error) {
    console.error("POST /api/car-insurance/analyze error:", error)
    return NextResponse.json({ error: "이미지 분석 중 오류가 발생했습니다" }, { status: 500 })
  }
}
