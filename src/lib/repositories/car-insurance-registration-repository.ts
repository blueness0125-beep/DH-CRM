import { SupabaseClient } from "@supabase/supabase-js"

export type CarInsuranceInsertPayload = {
  등록번호: string
  customer_id: string
  고객명: string
  관계인?: string | null
  생년월일?: string | null
  주민번호뒷자리?: string | null
  갱신일: string
  연락처?: string | null
  상태: string
  차량정보?: string | null
  비교내용?: string | null
  메모?: string | null
  가입정보경로?: string | null
  비교표경로?: string | null
  이미지경로?: string | null
}

export class CarInsuranceRegistrationRepository {
  constructor(private supabase: SupabaseClient) {}

  async insertCarInsurance(payload: CarInsuranceInsertPayload) {
    const { data, error } = await this.supabase
      .from("car_insurance_data")
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async existsByRegistrationId(등록번호: string) {
    const { count, error } = await this.supabase
      .from("car_insurance_data")
      .select("등록번호", { count: "exact", head: true })
      .eq("등록번호", 등록번호)

    if (error) throw error
    return (count ?? 0) > 0
  }
}
