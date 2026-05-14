"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Save, Loader2, Upload, X, ImageIcon, FileText } from "lucide-react"
import {
  carInsuranceRegistrationSchema,
  STATUS_OPTIONS,
  type CarInsuranceRegistration,
  type GeminiExtractItem,
} from "@/lib/validators/car-insurance-registration-schema"
import { toast } from "sonner"

type ZoneId = "main" | "other"

function buildCarText(items: GeminiExtractItem[]): string {
  return items
    .map((item, i) => {
      const lines = [`[차량 ${i + 1}]`]
      if (item.차량번호) lines.push(`차량번호: ${item.차량번호}`)
      if (item.가입사) lines.push(`가입사: ${item.가입사}`)
      if (item.보험종목) lines.push(`보험종목: ${item.보험종목}`)
      if (item.가입담보) lines.push(`가입담보: ${item.가입담보}`)
      if (item.연령한정_운전자) lines.push(`연령/운전자: ${item.연령한정_운전자}`)
      return lines.join("\n")
    })
    .join("\n\n")
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "")
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return raw
}

export function NewCarInsuranceForm() {
  const router = useRouter()
  const [activeZone, setActiveZone] = useState<ZoneId>("main")
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingOther, setUploadingOther] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [saving, setSaving] = useState(false)

  const [mainUrl, setMainUrl] = useState<string>("")
  const [pdfUrls, setPdfUrls] = useState<string[]>([])
  const [otherUrls, setOtherUrls] = useState<string[]>([])

  const [pendingItems, setPendingItems] = useState<GeminiExtractItem[]>([])
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false)

  const pdfInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CarInsuranceRegistration>({
    resolver: zodResolver(carInsuranceRegistrationSchema),
    defaultValues: {
      상태: STATUS_OPTIONS[0],
    },
  })

  const watchedStatus = watch("상태")

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/car-insurance/upload", { method: "POST", body: fd })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error || "업로드 실패")
      return null
    }
    const json = await res.json()
    return json.url as string
  }, [])

  const analyzeImage = useCallback(
    async (base64: string, mimeType: string) => {
      const res = await fetch("/api/car-insurance/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error || "AI 분석 실패")
        return null
      }
      const json = await res.json()
      return (json.data as GeminiExtractItem[]) ?? []
    },
    [],
  )

  const applyExtraction = useCallback(
    (items: GeminiExtractItem[]) => {
      if (items.length === 0) {
        toast.warning("이미지에서 추출된 정보가 없습니다")
        return
      }
      const first = items[0]
      if (first.피보험자) setValue("고객명", first.피보험자, { shouldValidate: true })
      if (first.생년월일) setValue("생년월일", first.생년월일)
      setValue("차량정보", buildCarText(items))

      const renewalDates = Array.from(
        new Set(items.map((i) => i.유효일자).filter((v): v is string => !!v)),
      )
      if (renewalDates.length === 1) {
        setValue("갱신일", renewalDates[0], { shouldValidate: true })
      } else if (renewalDates.length > 1) {
        setPendingItems(items)
        setRenewalDialogOpen(true)
      }
      toast.success(`${items.length}건 차량 정보 적용`)
    },
    [setValue],
  )

  const handlePasteImage = useCallback(
    async (file: File) => {
      const zone = activeZone
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        if (!dataUrl) return

        if (zone === "main") {
          setAnalyzing(true)
          setUploadingMain(true)
          try {
            const [items, url] = await Promise.all([
              analyzeImage(dataUrl, file.type || "image/png"),
              uploadFile(file),
            ])
            if (items) applyExtraction(items)
            if (url) setMainUrl(url)
          } finally {
            setAnalyzing(false)
            setUploadingMain(false)
          }
        } else {
          setUploadingOther(true)
          try {
            const url = await uploadFile(file)
            if (url) {
              setOtherUrls((prev) => [...prev, url])
              toast.success("기타 이미지 업로드 완료")
            }
          } finally {
            setUploadingOther(false)
          }
        }
      }
      reader.readAsDataURL(file)
    },
    [activeZone, analyzeImage, uploadFile, applyExtraction],
  )

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            handlePasteImage(file)
            return
          }
        }
      }
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [handlePasteImage])

  const onPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingPdf(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        if (url) setPdfUrls((prev) => [...prev, url])
      }
      toast.success(`${files.length}개 파일 업로드 완료`)
    } finally {
      setUploadingPdf(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ""
    }
  }

  const onSubmit = async (form: CarInsuranceRegistration) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        연락처: form.연락처 ? formatPhone(form.연락처) : null,
        가입정보경로: mainUrl || null,
        비교표경로: pdfUrls.length ? pdfUrls.join("\n") : null,
        이미지경로: otherUrls.length ? otherUrls.join("\n") : null,
      }
      const res = await fetch("/api/car-insurance/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(typeof body.error === "string" ? body.error : "저장 실패")
        return
      }
      toast.success("자동차보험 신규 등록 완료")
      router.push("/admin/renewals/car-insurance")
    } catch (error) {
      console.error(error)
      toast.error("저장 중 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  const status = watchedStatus ?? STATUS_OPTIONS[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">자동차보험 신규 등록</h1>
        <p className="text-sm text-muted-foreground">
          ① 영역에 가입정보 이미지를 Ctrl+V 하면 AI가 자동 분석합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📎 서류 첨부</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PasteZone
              label="① 현재 가입 정보 (AI 분석)"
              active={activeZone === "main"}
              onActivate={() => setActiveZone("main")}
              busy={analyzing || uploadingMain}
              filledLabel={mainUrl ? "업로드 완료" : null}
            />
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">② 비교표 (다중 업로드)</span>
                <Badge variant="secondary">{pdfUrls.length}개</Badge>
              </div>
              <input
                ref={pdfInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={onPdfChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingPdf}
              >
                {uploadingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                파일 선택
              </Button>
              {pdfUrls.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {pdfUrls.map((u, i) => (
                    <li key={u} className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      파일 {i + 1}
                      <button
                        type="button"
                        className="ml-auto text-destructive hover:underline"
                        onClick={() => setPdfUrls((prev) => prev.filter((x) => x !== u))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <PasteZone
              label="③ 기타 이미지 (분석 없음)"
              active={activeZone === "other"}
              onActivate={() => setActiveZone("other")}
              busy={uploadingOther}
              filledLabel={otherUrls.length ? `${otherUrls.length}개 업로드됨` : null}
              extras={
                otherUrls.length > 0 && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {otherUrls.map((u, i) => (
                      <li key={u} className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        이미지 {i + 1}
                        <button
                          type="button"
                          className="ml-auto text-destructive hover:underline"
                          onClick={() => setOtherUrls((prev) => prev.filter((x) => x !== u))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🧾 고객 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="고객명 *" error={errors.고객명?.message}>
                <Input {...register("고객명")} />
              </Field>
              <Field label="관계인">
                <Input {...register("관계인")} />
              </Field>
              <Field label="생년월일 (YYYY-MM-DD)" error={errors.생년월일?.message}>
                <Input {...register("생년월일")} placeholder="1990-01-01" />
              </Field>
              <Field label="주민번호 뒷자리" error={errors.주민번호뒷자리?.message}>
                <Input type="password" maxLength={7} {...register("주민번호뒷자리")} />
              </Field>
              <Field label="만기 갱신일 (MM-DD) *" error={errors.갱신일?.message}>
                <Input {...register("갱신일")} placeholder="03-15" />
              </Field>
              <Field label="연락처">
                <Input {...register("연락처")} placeholder="010-1234-5678" />
              </Field>
              <Field label="상태" className="md:col-span-1">
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setValue("상태", v as (typeof STATUS_OPTIONS)[number])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="차량 정보 (AI 자동 입력)">
              <Textarea rows={6} {...register("차량정보")} />
            </Field>
            <Field label="비교 분석 내용">
              <Textarea rows={4} {...register("비교내용")} />
            </Field>
            <Field label="추가 메모">
              <Textarea rows={3} {...register("메모")} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            저장
          </Button>
        </div>
      </form>

      <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>만기 갱신일 선택</DialogTitle>
            <DialogDescription>
              차량별 만기일이 다릅니다. 갱신일로 사용할 날짜를 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {Array.from(new Set(pendingItems.map((i) => i.유효일자).filter((v): v is string => !!v))).map(
              (date) => (
                <Button
                  key={date}
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setValue("갱신일", date, { shouldValidate: true })
                    setRenewalDialogOpen(false)
                  }}
                >
                  {date}
                </Button>
              ),
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenewalDialogOpen(false)}>
              나중에 선택
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PasteZone({
  label,
  active,
  onActivate,
  busy,
  filledLabel,
  extras,
}: {
  label: string
  active: boolean
  onActivate: () => void
  busy: boolean
  filledLabel: string | null
  extras?: React.ReactNode
}) {
  return (
    <div
      onMouseDown={onActivate}
      className={`flex min-h-[120px] cursor-pointer flex-col gap-2 rounded-md border-2 border-dashed p-3 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground">
        {active ? "이 영역 활성. Ctrl+V로 이미지를 붙여넣으세요" : "클릭 후 Ctrl+V"}
      </p>
      {filledLabel && (
        <Badge variant="secondary" className="self-start">
          {filledLabel}
        </Badge>
      )}
      {extras}
    </div>
  )
}
