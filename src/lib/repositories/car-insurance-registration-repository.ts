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

export type ContractInsertPayload = {
  car_insurance_id: string
  계약일: string
  보험사: string
  채널: string
  가입보험료: number | null
  차량번호: string | null
  차대번호: string | null
  증권번호: string | null
  시작일: string | null
  만기일: string | null
  피보험자: string | null
  계약자: string | null
  설계자: string | null
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

  async insertContracts(rows: ContractInsertPayload[]) {
    if (rows.length === 0) return []
    const { data, error } = await this.supabase
      .from("car_insurance_contracts")
      .insert(rows)
      .select()
    if (error) throw error
    return data
  }

  async deleteCarInsurance(등록번호: string) {
    const { error } = await this.supabase
      .from("car_insurance_data")
      .delete()
      .eq("등록번호", 등록번호)
    if (error) throw error
  }

  async findByRegistrationId(등록번호: string) {
    const { data, error } = await this.supabase
      .from("car_insurance_data")
      .select("*, customers ( * ), car_insurance_contracts(*)")
      .eq("등록번호", 등록번호)
      .single()
    if (error) throw error
    return data
  }

  async updateCarInsurance(
    등록번호: string,
    patch: Partial<Omit<CarInsuranceInsertPayload, "등록번호" | "customer_id" | "고객명">>,
  ) {
    const { data, error } = await this.supabase
      .from("car_insurance_data")
      .update(patch)
      .eq("등록번호", 등록번호)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async linkCustomer(
    등록번호: string,
    customerId: string,
  ) {
    const { data: customer, error: custErr } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()

    if (custErr || !customer) {
      throw new Error("고객을 찾을 수 없습니다.")
    }

    const isCorporate = customer.customer_type === "corporate" || !!customer.business_number

    const { data, error } = await this.supabase
      .from("car_insurance_data")
      .update({
        customer_id: customer.id,
        고객명: customer.name,
        생년월일: isCorporate ? (customer.business_number ?? null) : (customer.birth_date ?? null),
        주민번호뒷자리: isCorporate ? null : (customer.ssn_back ?? null),
        연락처: customer.phone ?? null,
      })
      .eq("등록번호", 등록번호)
      .select("*, customers(*)")
      .single()

    if (error) throw error
    return data
  }
}
