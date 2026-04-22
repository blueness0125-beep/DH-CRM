import { z } from "zod"

export const customerCreateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  customer_type: z.enum(["individual", "corporate"]).optional(),
  business_number: z.string().regex(/^\d{3}-\d{2}-\d{5}$/, "사업자등록번호 형식(000-00-00000)").nullable().optional().or(z.literal("")),
  birth_date: z.string().nullable().optional(),
  ssn_back: z.string().max(7).nullable().optional(),
  gender: z.enum(["M", "F"]).nullable().optional(),
  phone: z.string().nullable().optional(),
  phone_2: z.string().nullable().optional(),
  email: z.string().email("올바른 이메일을 입력해주세요").nullable().optional().or(z.literal("")),
  home_address: z.string().nullable().optional(),
  home_address_detail: z.string().nullable().optional(),
  home_zonecode: z.string().nullable().optional(),
  work_address: z.string().nullable().optional(),
  work_address_detail: z.string().nullable().optional(),
  work_zonecode: z.string().nullable().optional(),
  work_company_name: z.string().nullable().optional(),
  job_category: z.string().nullable().optional(),
  job_name: z.string().nullable().optional(),
  job_risk_grade: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_account: z.string().nullable().optional(),
  bank_holder: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  family_group_id: z.string().uuid().nullable().optional(),
  is_primary: z.boolean().optional(),
})

export const customerUpdateSchema = customerCreateSchema.partial()

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(["name", "birth_date", "created_at", "updated_at"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
})

export type CustomerCreate = z.infer<typeof customerCreateSchema>
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>
export type CustomerSearch = z.infer<typeof customerSearchSchema>
