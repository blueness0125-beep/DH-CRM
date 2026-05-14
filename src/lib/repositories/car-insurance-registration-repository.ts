import { SupabaseClient } from "@supabase/supabase-js"
import type { CarInsuranceRegistration } from "@/lib/validators/car-insurance-registration-schema"

export type CarInsuranceInsertPayload = CarInsuranceRegistration & {
  등록번호: string
  customer_id: string
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
