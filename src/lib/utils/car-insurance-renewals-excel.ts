import ExcelJS from "exceljs"
import { formatDate } from "@/lib/utils/format"

export type RenewalExportRow = {
  갱신일: string | null
  성명: string
  생년월일: string | null
  주민번호뒷자리: string | null
  fullRenewalDate: string
}

export async function exportRenewalsToExcel(
  rows: RenewalExportRow[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "DH-CRM"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName, {
    pageSetup: { orientation: "portrait", fitToPage: true },
  })

  sheet.columns = [
    { header: "순번", key: "seq", width: 6 },
    { header: "갱신일", key: "renewal", width: 14 },
    { header: "성명", key: "name", width: 14 },
    { header: "생년월일", key: "birth", width: 14 },
    { header: "주민등록번호뒷자리", key: "ssn", width: 18 },
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
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    }
  })
  headerRow.height = 22

  rows.forEach((r, idx) => {
    const row = sheet.addRow({
      seq: idx + 1,
      renewal: r.fullRenewalDate || r.갱신일 || "",
      name: r.성명,
      birth: formatDate(r.생년월일),
      ssn: r.주민번호뒷자리 ?? "",
    })

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
      cell.font = { size: 10 }
      cell.alignment = { vertical: "middle", horizontal: "center" }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
      }
    })
  })

  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
