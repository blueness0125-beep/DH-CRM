import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"
import { geminiExtractResultSchema } from "@/lib/validators/car-insurance-registration-schema"

export const runtime = "nodejs"
export const maxDuration = 60

const PROMPT = `이 이미지는 자동차 보험 계약 비교/조회 표(Table) 화면입니다.
각 순번의 가입 정보를 추출하여 JSON 리스트 형식으로 응답해주세요.

[표 구조 설명 - 매우 중요]
- 표의 제목(헤더) 줄은 '순번' 열만 제외하고 모두 [윗줄(1행)]과 [아랫줄(2행)]의 2줄 구조입니다.
- 하위의 데이터 행도 '순번' 열을 제외하면 각 순번마다 [윗줄(1행)]과 [아랫줄(2행)]의 2줄이 한 세트입니다.
  * 1열: [순번] (체크박스 포함)
  * 2열: 윗줄 [차량번호] / 아랫줄 [가입사]
  * 3열: 윗줄 [차종] (예: 소형B) / 아랫줄 [보험종목] (예: 개인용, 업무용)
  * 4열: 윗줄 [할인할증/등급] / 아랫줄 [특별할증]
  * 5열: 윗줄 [동일/일괄] / 아랫줄 [차량변경]
  * 6열: 윗줄 [가입경력] / 아랫줄 [법규위반]
  * 7열: 윗줄 [단기할인] / 아랫줄 [담보구분]
  * 8열: 윗줄 [계약번호] / 아랫줄 [가입담보]
  * 9열: 윗줄 [보험기간] / 아랫줄 [유효일자]
  * 10열: 윗줄 [피보험자] / 아랫줄 [연령한정/운전자]

[필드 추출 상세 규칙]
결과 객체는 다음 필드만 포함해주세요:
1. 피보험자: 10열 윗줄에서 이름만 추출 (예: '김민희(830507-2******)' -> '김민희')
2. 생년월일: 10열 윗줄 괄호 안 주민번호 앞자리 참고하여 YYYY-MM-DD 형식 (예: '830507' -> '1983-05-07')
3. 유효일자: 9열 아랫줄 유효일자(또는 보험기간 종료일)에서 MM-DD 형식 (예: '2026-09-26' -> '09-26')
4. 차량번호: 2열 윗줄 텍스트 (예: '41구3603')
5. 가입사: 2열 아랫줄 텍스트 (예: '삼성', 'DB', '현대' 등)
6. 보험종목: 반드시 3열 아랫줄 텍스트를 추출할 것! (절대 윗줄의 차종인 '소형B' 등을 넣지 말고, 아랫줄의 '개인용', '업무용' 등을 추출)
7. 가입담보: 반드시 8열 아랫줄에 보이는 글자 그대로 정확히 추출할 것!
   * 매우 중요: 보험 약어로 전체 풀네임은 '책인물자차무'이며, 해당 항목이 없으면 한 글자씩 빠집니다. (예: '책인물자무')
   * 절대 자연스러운 단어(예: '책임', '대인', '대물')로 임의 변형하거나 '책임물자무'로 잘못 읽지 마세요. 표에 적힌 글자 그대로 '책인물자무'처럼 '인' 글자를 정확히 추출하세요.
8. 연령한정_운전자: 10열 아랫줄 텍스트 (예: '43세이상/부부한정')

순번이 여러 개 있다면 각각 객체로 만들어 JSON 리스트([ ... ])로 응답하세요.
JSON 데이터 외의 다른 텍스트나 마크다운 설명은 절대 포함하지 마세요.`

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

    // 혹시라도 AI가 '책임'으로 오인식했을 경우 약어 원칙('책인')으로 안전망 보정
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === "object" && typeof item.가입담보 === "string") {
          item.가입담보 = item.가입담보.replace(/책임/g, "책인")
        }
      }
    }

    const validated = geminiExtractResultSchema.safeParse(parsed)
    if (!validated.success) {
      return NextResponse.json({ data: [], raw: text, warning: "schema mismatch" })
    }

    return NextResponse.json({ data: validated.data })
  } catch (error: unknown) {
    console.error("POST /api/car-insurance/analyze error:", error)
    const errMessage = error instanceof Error ? error.message : String(error)
    if (
      errMessage.includes("429") ||
      errMessage.includes("RESOURCE_EXHAUSTED") ||
      errMessage.includes("depleted")
    ) {
      return NextResponse.json(
        { error: "AI 분석 크레딧이 소진되었습니다. Google AI Studio 결제 설정을 확인해주세요." },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { error: "이미지 분석 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
