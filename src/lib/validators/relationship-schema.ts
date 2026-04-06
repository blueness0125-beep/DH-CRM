import { z } from "zod"

export const familyGroupCreateSchema = z.object({
  name: z.string().optional(),
  member_ids: z.array(z.string().uuid()).min(1, "최소 1명의 가족을 선택해주세요"),
  primary_id: z.string().uuid().optional(),
})

export const familyGroupAddMemberSchema = z.object({
  customer_id: z.string().uuid(),
})

export const relationshipCreateSchema = z.object({
  customer_id: z.string().uuid(),
  related_customer_id: z.string().uuid(),
  relationship_type: z.string().min(1, "관계를 선택해주세요"),
  note: z.string().nullable().optional(),
})

export type FamilyGroupCreate = z.infer<typeof familyGroupCreateSchema>
export type RelationshipCreate = z.infer<typeof relationshipCreateSchema>
