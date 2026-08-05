import { SupabaseClient } from "@supabase/supabase-js"
import { CarInsuranceRegistrationRepository } from "@/lib/repositories/car-insurance-registration-repository"
import type {
  CarInsuranceRegistration,
  CarInsuranceUpdate,
  ContractInput,
} from "@/lib/validators/car-insurance-registration-schema"

function generateRegistrationId(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function deriveRenewalFromContracts(contracts: ContractInput[]): string | null {
  const dates = contracts
    .map((c) => c.만기일)
    .filter((v): v is string => Boolean(v))
    .sort()
  if (dates.length === 0) return null
  const earliest = dates[0]
  const [, mm, dd] = earliest.split("-")
  return `${mm}-${dd}`
}

function deriveVehicleInfoFromContracts(contracts: ContractInput[]): string {
  return contracts
    .map((c, i) => {
      const lines = [`[차량 ${i + 1}]`]
      if (c.차량번호) lines.push(`차량번호: ${c.차량번호}`)
      if (c.차대번호) lines.push(`차대번호: ${c.차대번호}`)
      if (c.보험사) lines.push(`가입사: ${c.보험사}`)
      return lines.join("\n")
    })
    .join("\n\n")
}

export class CarInsuranceRegistrationService {
  private carRepo: CarInsuranceRegistrationRepository

  constructor(private supabase: SupabaseClient) {
    this.carRepo = new CarInsuranceRegistrationRepository(supabase)
  }

  async register(form: CarInsuranceRegistration) {
    const { data: customer, error: customerError } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", form.customer_id)
      .single()

    if (customerError || !customer) {
      throw new Error("선택한 고객을 찾을 수 없습니다")
    }

    // 한 고객이 여러 차량을 보유할 수 있고 차량마다 갱신일이 다를 수 있으므로
    // 동일 customer_id에 대한 car_insurance_data 다중 row를 허용한다.
    let 등록번호 = generateRegistrationId()
    if (await this.carRepo.existsByRegistrationId(등록번호)) {
      await new Promise((r) => setTimeout(r, 1000))
      등록번호 = generateRegistrationId()
    }

    const contracts = form.contracts ?? []
    const 갱신일 = form.갱신일 || deriveRenewalFromContracts(contracts) || ""
    const 차량정보 = form.차량정보 || (contracts.length > 0 ? deriveVehicleInfoFromContracts(contracts) : null)
    // 계약이 1건이라도 입력되면 상태를 자동으로 "완료"로 설정
    const 상태 = contracts.length > 0 ? "✅ 완료" : form.상태

    const { customer_id, contracts: _c, 갱신일: _r, 차량정보: _v, 상태: _s, ...rest } = form
    void _c
    void _r
    void _v
    void _s
    const isCorporate = customer.customer_type === "corporate" || !!customer.business_number
    const carRecord = await this.carRepo.insertCarInsurance({
      ...rest,
      갱신일,
      차량정보,
      상태,
      등록번호,
      customer_id,
      고객명: customer.name,
      생년월일: isCorporate ? (customer.business_number ?? null) : (customer.birth_date ?? null),
      주민번호뒷자리: isCorporate ? null : (customer.ssn_back ?? null),
      연락처: customer.phone ?? null,
    })

    try {
      if (contracts.length > 0) {
        await this.carRepo.insertContracts(
          contracts.map((c) => ({
            ...c,
            car_insurance_id: 등록번호,
          })),
        )
      }
    } catch (error) {
      // rollback car_insurance_data
      await this.carRepo.deleteCarInsurance(등록번호).catch((rollbackError) => {
        console.error("car_insurance_data rollback failed:", rollbackError)
      })
      throw error
    }

    return { customer, carRecord, contractsCount: contracts.length }
  }

  async findByRegistrationId(등록번호: string) {
    return this.carRepo.findByRegistrationId(등록번호)
  }

  async update(등록번호: string, patch: CarInsuranceUpdate) {
    const cleaned = {
      관계인: patch.관계인 ?? null,
      갱신일: patch.갱신일 || "",
      상태: patch.상태,
      차량정보: patch.차량정보 ?? null,
      비교내용: patch.비교내용 ?? null,
      메모: patch.메모 ?? null,
      가입정보경로: patch.가입정보경로 ?? null,
      비교표경로: patch.비교표경로 ?? null,
      이미지경로: patch.이미지경로 ?? null,
    }
    return this.carRepo.updateCarInsurance(등록번호, cleaned)
  }

  async linkCustomer(등록번호: string, customerId: string) {
    return this.carRepo.linkCustomer(등록번호, customerId)
  }
}
