import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"
import { geminiExtractResultSchema } from "@/lib/validators/car-insurance-registration-schema"

export const runtime = "nodejs"
export const maxDuration = 60

const PROMPT = `이 이미지는 자동차 보험 계약 관련 표(Table) 화면입니다.
표의 헤더와 각 데이터 행을 정확히 매핑하여 가입 정보를 JSON 리스트 형식으로 응답해주세요.

[표 구조 분석 및 매핑 원리 - 매우 중요]
1. 2줄 헤더와 2줄 데이터의 1:1 대응 원리:
   - 이 표는 컬럼 헤더(제목 행)가 한 열 안에 [윗줄 제목]과 [아랫줄 제목]의 2줄로 구성되어 있습니다.
   - 이에 따라 하위의 각 데이터 행도 동일하게 한 열 안에 [윗줄 내용]과 [아랫줄 내용]의 2줄로 구성되어 있습니다.
   - 특정 열 번호에 고정하지 말고, 반드시 해당 열의 헤더 제목 라벨이 '윗줄'인지 '아랫줄'인지 확인하여 데이터 행의 동일한 줄 위치에서 값을 1:1로 매핑해야 합니다:
     * 헤더 윗줄의 제목 (예: '차종', '차량번호', '피보험자', '보험기간' 등) → 데이터 행의 [윗줄 내용]에 매핑
     * 헤더 아랫줄의 제목 (예: '보험종목', '가입사', '연령한정/운전자', '유효일자', '가입담보' 등) → 데이터 행의 [아랫줄 내용]에 매핑
   - (원리 예시): 어떤 열의 헤더에 [윗줄: '차종' / 아랫줄: '보험종목']으로 적혀 있다면, 데이터 행의 윗줄 값은 '차종'이고 아랫줄 값은 '보험종목'입니다. 따라서 '보험종목' 필드에는 절대 윗줄의 차종(예: '소형B' 등)이 아니라, 아랫줄 제목인 '보험종목'에 해당하는 값(예: '개인용', '업무용' 등)을 가져와야 합니다.

[필드 추출 상세 규칙]
결과 객체는 다음 필드만 포함해주세요:
- 피보험자: '피보험자' 제목에 대응하는 데이터에서 괄호 앞의 이름만 추출 (예: '김민희(830507-2******)' -> '김민희')
- 생년월일: '피보험자' 항목의 주민번호 앞자리(YYMMDD)를 참고하여 YYYY-MM-DD 형식으로 변환 (예: '830507' -> '1983-05-07')
- 유효일자: '유효일자'(또는 보험기간 종료일) 제목에 대응하는 데이터에서 MM-DD 형식으로 추출 (예: '2026-09-26' -> '09-26')
- 차량번호: '차량번호' 제목에 대응하는 데이터
- 가입사: '가입사' 제목에 대응하는 데이터 (예: '삼성', 'DB', '현대' 등)
- 보험종목: '보험종목' 제목에 대응하는 데이터 (헤더에서 '보험종목'이 위치한 줄의 값. 절대 '차종'의 값을 넣지 말 것)
- 가입담보: '가입담보' 제목에 대응하는 데이터
  * 중요: 보험 약어로 전체 풀네임은 '책인물자차무'이며, 가입하지 않은 항목은 글자가 빠집니다 (예: '책인물자무').
  * 절대 자연스러운 단어로 임의 변형(예: '책임', '대인')하지 말고, 이미지 표에 보이는 글자 그대로 정확히 추출하세요.
- 연령한정_운전자: '연령한정/운전자' 제목에 대응하는 데이터 (예: '43세이상/부부한정')

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
