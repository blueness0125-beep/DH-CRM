import * as XLSX from "xlsx"
import type { CustomerCreate } from "@/lib/validators/customer-schema"

export type ParsedRow = {
  rowIndex: number
  name: string
  birth_date?: string
  ssn_back?: string
  gender?: "M" | "F"
  phone?: string
  home_address?: string
  home_zonecode?: string
  memo?: string
  // 순번: 있으면 주 고객, 없으면 가족
  sequenceCode?: string
  error?: string
}

export type ParseResult = {
  rows: ParsedRow[]
  errors: string[]
}

// 주민번호 앞자리(6자리)로 생년월일 + 성별 추출
function parseSsnFront(ssn: string): { birth_date?: string; gender?: "M" | "F" } {
  const digits = String(ssn).replace(/\D/g, "")
  if (digits.length < 6) return {}

  const yy = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const dd = digits.slice(4, 6)

  // 뒷자리 첫 번째 숫자로 성별/세기 구분 (선택적으로 7번째 인덱스)
  const year = parseInt(yy) <= 25 ? `20${yy}` : `19${yy}`
  const birth_date = `${year}-${mm}-${dd}`

  return { birth_date }
}

function parseSsnBack(ssn: string): { gender?: "M" | "F"; ssn_back?: string } {
  const digits = String(ssn).replace(/\D/g, "")
  if (!digits) return {}

  const firstDigit = parseInt(digits[0])
  let gender: "M" | "F" | undefined
  if ([1, 3, 5, 7, 9].includes(firstDigit)) gender = "M"
  else if ([2, 4, 6, 8, 0].includes(firstDigit)) gender = "F"

  return { gender, ssn_back: digits.slice(0, 7) }
}

function normalizePhone(phone: unknown): string {
  if (!phone) return ""
  const str = String(phone).replace(/\D/g, "")
  if (str.length === 11) return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7)}`
  if (str.length === 10) return `${str.slice(0, 3)}-${str.slice(3, 6)}-${str.slice(6)}`
  return String(phone)
}

// 엑셀 날짜 시리얼 -> YYYY-MM-DD
function excelDateToString(val: unknown): string {
  if (!val) return ""
  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, "0")
      const d = String(date.d).padStart(2, "0")
      return `${y}-${m}-${d}`
    }
  }
  return String(val)
}

export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  })

  const parsed: ParsedRow[] = []
  const errors: string[] = []

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2 // 헤더 포함 행 번호

    // 컬럼 키 정규화 (공백 제거)
    const r: Record<string, unknown> = {}
    for (const key of Object.keys(row)) {
      r[key.trim()] = row[key]
    }

    const name = String(r["이름"] ?? r["성명"] ?? "").trim()
    if (!name) return // 빈 행 스킵

    const sequenceCode = r["순번"] ? String(r["순번"]).trim() : undefined

    // 주민번호 처리
    const ssnFrontRaw = r["주민번호앞"] ?? r["주민번호 앞"] ?? r["생년월일"] ?? ""
    const ssnBackRaw = r["주민번호뒤"] ?? r["주민번호 뒤"] ?? r["주민번호뒷"] ?? ""

    const { birth_date: bdFromSsn } = parseSsnFront(String(ssnFrontRaw))
    const { gender, ssn_back } = parseSsnBack(String(ssnBackRaw))

    // 생년월일 직접 입력 우선
    let birth_date = bdFromSsn
    const rawBd = r["생년월일"]
    if (rawBd && String(rawBd).length >= 6) {
      const fromExcel = excelDateToString(rawBd)
      if (fromExcel.match(/^\d{4}-\d{2}-\d{2}$/)) {
        birth_date = fromExcel
      }
    }

    const phone = normalizePhone(r["전화번호"] ?? r["휴대폰"] ?? r["연락처"])
    const home_address = String(r["주소"] ?? r["자택주소"] ?? r["집주소"] ?? "").trim()
    const home_zonecode = String(r["우편번호"] ?? "").trim()
    const memo = String(r["메모"] ?? r["비고"] ?? "").trim()

    parsed.push({
      rowIndex,
      name,
      birth_date: birth_date || undefined,
      ssn_back: ssn_back || undefined,
      gender,
      phone: phone || undefined,
      home_address: home_address || undefined,
      home_zonecode: home_zonecode || undefined,
      memo: memo || undefined,
      sequenceCode,
    })
  })

  return { rows: parsed, errors }
}

export function parsedRowToCustomerCreate(row: ParsedRow): CustomerCreate {
  return {
    name: row.name,
    birth_date: row.birth_date ?? "",
    ssn_back: row.ssn_back ?? "",
    gender: row.gender,
    phone: row.phone ?? "",
    home_address: row.home_address ?? "",
    home_zonecode: row.home_zonecode ?? "",
    memo: row.memo ?? "",
  }
}
