import { SupabaseClient } from "@supabase/supabase-js"
import { CarInsuranceRegistrationRepository } from "@/lib/repositories/car-insurance-registration-repository"
import { CustomerRepository } from "@/lib/repositories/customer-repository"
import type { CarInsuranceRegistration } from "@/lib/validators/car-insurance-registration-schema"
import type { CustomerCreate } from "@/lib/validators/customer-schema"

function generateRegistrationId(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  return raw.replace(/[^\d-]/g, "") || null
}

export class CarInsuranceRegistrationService {
  private carRepo: CarInsuranceRegistrationRepository
  private customerRepo: CustomerRepository

  constructor(supabase: SupabaseClient) {
    this.carRepo = new CarInsuranceRegistrationRepository(supabase)
    this.customerRepo = new CustomerRepository(supabase)
  }

  async register(form: CarInsuranceRegistration, createdBy?: string) {
    const customerPayload: CustomerCreate = {
      name: form.고객명,
      customer_type: "individual",
      birth_date: form.생년월일 || null,
      ssn_back: form.주민번호뒷자리 || null,
      phone: normalizePhone(form.연락처),
      memo: form.메모 || null,
    }

    const customer = await this.customerRepo.create(customerPayload, createdBy)

    let 등록번호 = generateRegistrationId()
    if (await this.carRepo.existsByRegistrationId(등록번호)) {
      await new Promise((r) => setTimeout(r, 1000))
      등록번호 = generateRegistrationId()
    }

    try {
      const carRecord = await this.carRepo.insertCarInsurance({
        ...form,
        등록번호,
        customer_id: customer.id,
        연락처: normalizePhone(form.연락처),
      })
      return { customer, carRecord }
    } catch (error) {
      await this.customerRepo.delete(customer.id).catch((rollbackError) => {
        console.error("Customer rollback failed:", rollbackError)
      })
      throw error
    }
  }
}
