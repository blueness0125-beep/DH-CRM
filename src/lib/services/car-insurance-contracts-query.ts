import { SupabaseClient } from "@supabase/supabase-js"

/** 자동차보험 계약 목록 1건 (car_insurance_contracts + 고객 정보) */
export type ContractListItem = {
  id: string
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
  등록번호: string
  고객명: string | null
  customer_id: string | null
}

/** 조회 기간 (계약일 기준). to 가 null 이면 from 이후 전체(최근 N일 모드). */
export type ContractFilter = {
  from: string | null
  to: string | null
  label: string
  tag: string
}

type RawContractRow = Omit<ContractListItem, "등록번호" | "고객명" | "customer_id"> & {
  car_insurance_id: string
  car_insurance_data: {
    등록번호: string
    고객명: string | null
    customer_id: string | null
    customers: { name: string } | null
  } | null
}

const pad = (n: number) => String(n).padStart(2, "0")

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 쿼리 파라미터 → 조회 기간 변환 (모두 "계약일" 기준).
 * - month=YYYY-MM   → 해당 월 1일 ~ 말일
 * - from & to       → 지정 기간
 * - (없음)          → 기본값: 최근 45일 (계약일 >= 오늘-44일)
 */
export function parseContractFilter(searchParams: URLSearchParams): ContractFilter {
  const month = searchParams.get("month")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number)
    const lastDay = new Date(y, m, 0).getDate() // m월 말일 (런타임 계산)
    return {
      from: `${month}-01`,
      to: `${month}-${pad(lastDay)}`,
      label: `${y}년 ${m}월`,
      tag: `${y}${pad(m)}`,
    }
  }

  if (from && to) {
    return { from, to, label: `${from} ~ ${to}`, tag: `${from}_${to}` }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - 44) // 오늘 포함 최근 45일
  return { from: toLocalDateStr(start), to: null, label: "최근 45일", tag: "최근45일" }
}

/** 계약일 기준 기간 필터로 계약 목록 조회 (정렬은 호출 측 책임). */
export async function fetchFilteredContracts(
  supabase: SupabaseClient,
  filter: ContractFilter,
): Promise<ContractListItem[]> {
  let query = supabase
    .from("car_insurance_contracts")
    .select(
      "*, car_insurance_data ( 등록번호, 고객명, customer_id, customers ( name ) )",
    )

  // 계약일은 "YYYY-MM-DD" 텍스트 → 사전식 비교가 곧 날짜 비교
  if (filter.from) query = query.gte("계약일", filter.from)
  if (filter.to) query = query.lte("계약일", filter.to)

  const { data, error } = await query
  if (error) throw error

  return ((data as unknown as RawContractRow[]) ?? []).map((r) => ({
    id: r.id,
    계약일: r.계약일,
    보험사: r.보험사,
    채널: r.채널,
    가입보험료: r.가입보험료,
    차량번호: r.차량번호,
    차대번호: r.차대번호,
    증권번호: r.증권번호,
    시작일: r.시작일,
    만기일: r.만기일,
    피보험자: r.피보험자,
    계약자: r.계약자,
    설계자: r.설계자,
    등록번호: r.car_insurance_data?.등록번호 ?? r.car_insurance_id,
    고객명: r.car_insurance_data?.customers?.name ?? r.car_insurance_data?.고객명 ?? null,
    customer_id: r.car_insurance_data?.customer_id ?? null,
  }))
}
