export type Customer = {
  id: string
  sequence_code: string | null
  name: string
  birth_date: string | null
  ssn_back: string | null
  gender: "M" | "F" | null
  phone: string | null
  phone_2: string | null
  email: string | null
  home_address: string | null
  home_address_detail: string | null
  home_zonecode: string | null
  work_address: string | null
  work_address_detail: string | null
  work_zonecode: string | null
  work_company_name: string | null
  job_category: string | null
  job_name: string | null
  job_risk_grade: string | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  memo: string | null
  family_group_id: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type CustomerWithRelations = Customer & {
  family_members?: Customer[]
  relationships?: CustomerRelationship[]
  car_insurance_data?: CarInsurance[]
  insurance_products?: InsuranceProduct[]
}

export type FamilyGroup = {
  id: string
  name: string | null
  created_at: string
}

export type CustomerRelationship = {
  id: string
  customer_id: string
  related_customer_id: string
  relationship_type: string
  note: string | null
  created_at: string
  related_customer?: Customer
}

export type CarInsurance = {
  등록번호: string
  고객명: string
  관계인: string | null
  생년월일: string | null
  주민번호뒷자리: string | null
  갱신일: string | null
  차량정보: string | null
  연락처: string | null
  상태: string | null
  비교내용: string | null
  비교표경로: string | null
  가입정보경로: string | null
  이미지경로: string | null
  메모: string | null
  customer_id: string
}

export type InsuranceProduct = {
  id: string
  customer_id: string
  product_type: string
  company: string | null
  contract_date: string | null
  expiry_date: string | null
  premium: number | null
  status: "active" | "expired" | "cancelled"
  memo: string | null
  created_at: string
  updated_at: string
}

export type ContactLog = {
  id: string
  customer_id: string
  contact_type: "전화" | "방문" | "문자" | "카톡" | "이메일" | "기타"
  content: string
  contacted_at: string
  created_by: string | null
  created_at: string
}

export type CustomerMemo = {
  id: string
  customer_id: string
  content: string
  is_pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}
