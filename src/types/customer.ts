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
  car_insurances?: CarInsurance[]
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
  id: string
  customer_id: string
  car_number: string | null
  insurance_company: string | null
  expiry_date: string | null
  premium: number | null
  memo: string | null
  created_at: string
  updated_at: string
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
