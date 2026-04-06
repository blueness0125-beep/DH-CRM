import ExcelJS from "exceljs"
import type { Customer } from "@/types/customer"
import { formatPhone, formatDate, formatGender } from "@/lib/utils/format"

export async function exportCustomersToExcel(customers: Customer[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "DH-CRM"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("고객목록", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  })

  // 헤더 정의
  sheet.columns = [
    { header: "순번", key: "seq", width: 6 },
    { header: "이름", key: "name", width: 12 },
    { header: "생년월일", key: "birth_date", width: 14 },
    { header: "성별", key: "gender", width: 6 },
    { header: "전화번호", key: "phone", width: 16 },
    { header: "전화번호2", key: "phone_2", width: 16 },
    { header: "이메일", key: "email", width: 24 },
    { header: "자택주소", key: "home_address", width: 30 },
    { header: "자택상세", key: "home_address_detail", width: 20 },
    { header: "직장명", key: "work_company_name", width: 16 },
    { header: "직장주소", key: "work_address", width: 30 },
    { header: "직업분류", key: "job_category", width: 12 },
    { header: "직업명", key: "job_name", width: 14 },
    { header: "위험등급", key: "job_risk_grade", width: 10 },
    { header: "은행", key: "bank_name", width: 10 },
    { header: "계좌번호", key: "bank_account", width: 20 },
    { header: "예금주", key: "bank_holder", width: 10 },
    { header: "메모", key: "memo", width: 30 },
  ]

  // 헤더 스타일
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00008B" },
    }
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    }
  })
  headerRow.height = 22

  // 데이터 행
  customers.forEach((c, idx) => {
    const row = sheet.addRow({
      seq: idx + 1,
      name: c.name,
      birth_date: formatDate(c.birth_date),
      gender: formatGender(c.gender),
      phone: formatPhone(c.phone),
      phone_2: formatPhone(c.phone_2),
      email: c.email ?? "",
      home_address: c.home_address ?? "",
      home_address_detail: c.home_address_detail ?? "",
      work_company_name: c.work_company_name ?? "",
      work_address: c.work_address ?? "",
      job_category: c.job_category ?? "",
      job_name: c.job_name ?? "",
      job_risk_grade: c.job_risk_grade ?? "",
      bank_name: c.bank_name ?? "",
      bank_account: c.bank_account ?? "",
      bank_holder: c.bank_holder ?? "",
      memo: c.memo ?? "",
    })

    // 홀짝 행 배경색
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5FF" },
        }
      })
    }

    row.eachCell((cell) => {
      cell.font = { size: 9 }
      cell.alignment = { vertical: "middle" }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
      }
    })
  })

  // 자동 필터
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  }

  // 첫 행 고정
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
