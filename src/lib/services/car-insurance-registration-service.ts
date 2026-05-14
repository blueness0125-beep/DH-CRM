import { SupabaseClient } from "@supabase/supabase-js"
import { CarInsuranceRegistrationRepository } from "@/lib/repositories/car-insurance-registration-repository"
import type { CarInsuranceRegistration } from "@/lib/validators/car-insurance-registration-schema"

function generateRegistrationId(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export class CarInsuranceRegistrationService {
  private carRepo: CarInsuranceRegistrationRepository

  constructor(private supabase: SupabaseClient) {
    this.carRepo = new CarInsuranceRegistrationRepository(supabase)
  }

  async register(form: CarInsuranceRegistration) {
    const { data: customer, error: customerError } = await this.supabase
      .from("customers")
      .select("id, name, phone, birth_date, ssn_back")
      .eq("id", form.customer_id)
      .single()

    if (customerError || !customer) {
      throw new Error("선택한 고객을 찾을 수 없습니다")
    }

    const { count, error: countError } = await this.supabase
      .from("car_insurance_data")
      .select("등록번호", { count: "exact", head: true })
      .eq("customer_id", form.customer_id)

    if (countError) throw countError
    if ((count ?? 0) > 0) {
      throw new Error(
        "이미 자동차보험 정보가 등록된 고객입니다. 자동차보험 갱신/계약 입력 메뉴를 이용해주세요.",
      )
    }

    let 등록번호 = generateRegistrationId()
    if (await this.carRepo.existsByRegistrationId(등록번호)) {
      await new Promise((r) => setTimeout(r, 1000))
      등록번호 = generateRegistrationId()
    }

    const { customer_id, ...rest } = form
    const carRecord = await this.carRepo.insertCarInsurance({
      ...rest,
      등록번호,
      customer_id,
      고객명: customer.name,
      생년월일: customer.birth_date ?? null,
      주민번호뒷자리: customer.ssn_back ?? null,
      연락처: customer.phone ?? null,
    })
    return { customer, carRecord }
  }
}
