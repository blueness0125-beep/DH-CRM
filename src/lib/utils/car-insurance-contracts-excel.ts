import ExcelJS from "exceljs"

/** 본사 보고 양식 한 행에 필요한 필드 */
export type ContractExcelRow = {
  계약일: string
  보험사: string
  채널: string
  가입보험료: number | null
  차량번호: string | null
  증권번호: string | null
  시작일: string | null
  만기일: string | null
  피보험자: string | null
  계약자: string | null
}

/** F열(특이사항) 고정 접두어 — 요구사항: 항상 "송상훈" + 계약자명 */
const SPECIAL_NOTE_PREFIX = "송상훈"

function toDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * "자동차보험 계약 본사 보고 양식" 12컬럼 엑셀 생성.
 * A 계약일(날짜) · B 보험사 · C 채널 · D 가입보험료(숫자) · E 차량번호 ·
 * F 특이사항("송상훈 / 계약자") · G 증권번호 · H 계약기간(시작일,날짜) ·
 * I 만기일(날짜) · J 피보험자 · K 계약자 · L 비고
 */
export async function exportContractsToExcel(
  rows: ContractExcelRow[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "DH-CRM"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName, {
    pageSetup: { orientation: "landscape", fitToPage: true },
  })

  sheet.columns = [
    { header: "계약일", width: 12 },
    { header: "보험사", width: 12 },
    { header: "채널", width: 10 },
    { header: "가입보험료", width: 12 },
    { header: "차량번호", width: 12 },
    { header: "특이사항", width: 18 },
    { header: "증권번호", width: 20 },
    { header: "계약기간", width: 12 },
    { header: "만기일", width: 12 },
    { header: "피보험자", width: 10 },
    { header: "계약자", width: 10 },
    { header: "비고", width: 12 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00008B" },
    }
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } }
  })
  headerRow.height = 22

  rows.forEach((r, idx) => {
    const row = sheet.addRow([
      toDate(r.계약일), // A
      r.보험사 ?? "", // B
      r.채널 ?? "", // C
      r.가입보험료 ?? null, // D
      r.차량번호 ?? "", // E (없으면 빈칸)
      `${SPECIAL_NOTE_PREFIX} / ${r.계약자 ?? ""}`, // F
      r.증권번호 ?? "", // G
      toDate(r.시작일), // H
      toDate(r.만기일), // I
      r.피보험자 ?? "", // J
      r.계약자 ?? "", // K
      "", // L 비고
    ])

    row.getCell(1).numFmt = "yyyy-mm-dd" // 계약일
    row.getCell(4).numFmt = "#,##0" // 가입보험료
    row.getCell(8).numFmt = "yyyy-mm-dd" // 계약기간(시작일)
    row.getCell(9).numFmt = "yyyy-mm-dd" // 만기일

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5FF" } }
      })
    }

    row.eachCell((cell) => {
      cell.font = { size: 10 }
      cell.alignment = { vertical: "middle", horizontal: "center" }
      cell.border = { bottom: { style: "hair", color: { argb: "FFDDDDDD" } } }
    })
  })

  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
