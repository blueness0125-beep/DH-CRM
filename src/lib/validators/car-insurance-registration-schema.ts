import { z } from "zod"

export const STATUS_OPTIONS = ["🛠️ 정리 중", "📞 상담 대기", "✅ 완료", "❌ 보류"] as const

export const contractInputSchema = z.object({
  계약일: z.string().min(1),
  보험사: z.string().min(1),
  채널: z.string().min(1),
  가입보험료: z.number().int().nonnegative().nullable(),
  차량번호: z.string().nullable(),
  차대번호: z.string().nullable(),
  증권번호: z.string().nullable(),
  시작일: z.string().nullable(),
  만기일: z.string().nullable(),
  피보험자: z.string().nullable(),
  계약자: z.string().nullable(),
  설계자: z.string().nullable(),
})
export type ContractInput = z.infer<typeof contractInputSchema>

export const carInsuranceRegistrationSchema = z.object({
  customer_id: z.string().uuid("기존 고객을 선택해주세요"),
  관계인: z.string().nullable().optional(),
  갱신일: z
    .string()
    .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "MM-DD 형식")
    .or(z.literal(""))
    .nullable()
    .optional(),
  상태: z.enum(STATUS_OPTIONS),
  차량정보: z.string().nullable().optional(),
  비교내용: z.string().nullable().optional(),
  메모: z.string().nullable().optional(),
  가입정보경로: z.string().nullable().optional(),
  비교표경로: z.string().nullable().optional(),
  이미지경로: z.string().nullable().optional(),
  contracts: z.array(contractInputSchema).optional(),
})

export type CarInsuranceRegistration = z.infer<typeof carInsuranceRegistrationSchema>

export const carInsuranceUpdateSchema = carInsuranceRegistrationSchema.omit({
  customer_id: true,
  contracts: true,
})
export type CarInsuranceUpdate = z.infer<typeof carInsuranceUpdateSchema>

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
