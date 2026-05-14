import { z } from "zod"

export const STATUS_OPTIONS = ["🛠️ 정리 중", "📞 상담 대기", "✅ 완료", "❌ 보류"] as const

export const carInsuranceRegistrationSchema = z.object({
  고객명: z.string().min(1, "고객명을 입력해주세요"),
  관계인: z.string().nullable().optional(),
  생년월일: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식")
    .nullable()
    .optional()
    .or(z.literal("")),
  주민번호뒷자리: z
    .string()
    .regex(/^\d{7}$/, "주민번호 뒷자리 7자리")
    .nullable()
    .optional()
    .or(z.literal("")),
  갱신일: z
    .string()
    .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "MM-DD 형식"),
  연락처: z.string().nullable().optional(),
  상태: z.enum(STATUS_OPTIONS),
  차량정보: z.string().nullable().optional(),
  비교내용: z.string().nullable().optional(),
  메모: z.string().nullable().optional(),
  가입정보경로: z.string().nullable().optional(),
  비교표경로: z.string().nullable().optional(),
  이미지경로: z.string().nullable().optional(),
})

export type CarInsuranceRegistration = z.infer<typeof carInsuranceRegistrationSchema>

export const geminiExtractItemSchema = z.object({
  피보험자: z.string().optional(),
  생년월일: z.string().optional(),
  유효일자: z.string().optional(),
  차량번호: z.string().optional(),
  가입사: z.string().optional(),
  보험종목: z.string().optional(),
  가입담보: z.string().optional(),
  연령한정_운전자: z.string().optional(),
})

export const geminiExtractResultSchema = z.array(geminiExtractItemSchema)

export type GeminiExtractItem = z.infer<typeof geminiExtractItemSchema>
