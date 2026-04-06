"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { parseExcelFile, type ParsedRow } from "@/lib/utils/excel-parser"
import { toast } from "sonner"

type ImportStep = "upload" | "preview" | "done"

type ImportResult = {
  created: number
  skipped: number
  errors: string[]
}

export function ImportPageClient() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<ImportStep>("upload")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const { rows: parsed, errors } = parseExcelFile(buffer)

      if (parsed.length === 0) {
        toast.error("읽을 수 있는 데이터가 없습니다. 컬럼명을 확인해주세요.")
        return
      }

      setRows(parsed)
      setParseErrors(errors)
      setStep("preview")
    } catch {
      toast.error("파일을 읽는 중 오류가 발생했습니다")
    }
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })

      const json = await res.json()
      if (res.ok) {
        setResult(json.data)
        setStep("done")
      } else {
        toast.error(json.error ?? "임포트에 실패했습니다")
      }
    } catch {
      toast.error("임포트에 실패했습니다")
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep("upload")
    setRows([])
    setParseErrors([])
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">엑셀 임포트</h1>
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">파일 선택</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              엑셀 파일(.xlsx, .xls)을 업로드하세요. 첫 번째 시트에서 다음 컬럼을 읽습니다.
            </p>
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">인식 가능한 컬럼명</p>
              <div className="flex flex-wrap gap-1.5">
                {["순번", "이름/성명", "주민번호앞", "주민번호뒤", "생년월일", "전화번호/휴대폰/연락처", "주소/자택주소", "우편번호", "메모/비고"].map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">클릭하여 파일 선택</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls 지원</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">미리보기</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rows.length}건</Badge>
                  {parseErrors.length > 0 && (
                    <Badge variant="destructive">{parseErrors.length}개 오류</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {parseErrors.length > 0 && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive space-y-1">
                  {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium text-muted-foreground pr-3">행</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground pr-3">이름</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground pr-3">생년월일</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground pr-3">성별</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground pr-3">전화번호</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row) => (
                      <tr key={row.rowIndex} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 text-muted-foreground">{row.rowIndex}</td>
                        <td className="py-1.5 pr-3 font-medium">{row.name}</td>
                        <td className="py-1.5 pr-3">{row.birth_date ?? "-"}</td>
                        <td className="py-1.5 pr-3">{row.gender === "M" ? "남" : row.gender === "F" ? "여" : "-"}</td>
                        <td className="py-1.5 pr-3">{row.phone ?? "-"}</td>
                        <td className="py-1.5 max-w-[200px] truncate">{row.home_address ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    ... 외 {rows.length - 50}건 (총 {rows.length}건)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={reset}>다시 선택</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />임포트 중...</>
                : <><Upload className="mr-2 h-4 w-4" />{rows.length}건 가져오기</>
              }
            </Button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              임포트 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.created}</p>
                <p className="text-sm text-green-600">등록됨</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                <p className="text-sm text-yellow-600">중복 스킵</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
                <p className="text-sm text-red-600">오류</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="flex items-start gap-1">
                    <XCircle className="h-3 w-3 mt-0.5 shrink-0" />{e}
                  </p>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>다시 임포트</Button>
              <Button onClick={() => router.push("/admin/customers")}>고객 목록 보기</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
