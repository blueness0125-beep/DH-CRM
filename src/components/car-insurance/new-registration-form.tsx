"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Save, Loader2, Upload, X, ImageIcon, FileText, Search, UserCheck } from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import {
  carInsuranceRegistrationSchema,
  STATUS_OPTIONS,
  type CarInsuranceRegistration,
  type GeminiExtractItem,
} from "@/lib/validators/car-insurance-registration-schema"
import { formatPhone, formatDate, calculateAge, formatGender } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
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

export function NewCarInsuranceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCustomerId = searchParams.get("customer_id")

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
      customer_id: prefilledCustomerId ?? undefined,
    },
  })

  const watchedStatus = watch("상태")

  // URL ?customer_id=... 로 진입한 경우 고객 정보 미리 로드
  useEffect(() => {
    if (!prefilledCustomerId) return
    let cancelled = false
    setLoadingCustomer(true)
    fetch(`/api/customers/${prefilledCustomerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return
        const c: Customer | null = body?.data ?? null
        if (c) {
          setCustomer(c)
          setValue("customer_id", c.id, { shouldValidate: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCustomer(false)
      })
    return () => {
      cancelled = true
    }
  }, [prefilledCustomerId, setValue])

  const selectCustomer = (c: Customer) => {
    setCustomer(c)
    setValue("customer_id", c.id, { shouldValidate: true })
    setSearchOpen(false)
  }

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
      if (!customer) {
        toast.error("먼저 고객을 선택해주세요")
        return
      }
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
    [activeZone, analyzeImage, uploadFile, applyExtraction, customer],
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
    if (!customer) {
      toast.error("먼저 고객을 선택해주세요")
      return
    }
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
    if (!customer) {
      toast.error("고객을 먼저 선택해주세요")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
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
      router.push(`/admin/customers/${customer.id}`)
    } catch (error) {
      console.error(error)
      toast.error("저장 중 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  const status = watchedStatus ?? STATUS_OPTIONS[0]

  // 고객 미선택 시 — 검색만 노출
  if (!customer) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">자동차보험 신규 등록</h1>
          <p className="text-sm text-muted-foreground">
            먼저 자동차보험을 등록할 기존 고객을 선택해주세요.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            {loadingCustomer ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">고객 검색을 시작하세요</p>
                <Button onClick={() => setSearchOpen(true)}>
                  <Search className="mr-2 h-4 w-4" />
                  고객 검색
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <CustomerSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelect={selectCustomer}
          title="자동차보험을 등록할 고객 선택"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">자동차보험 신규 등록</h1>
          <p className="text-sm text-muted-foreground">
            ① 영역에 가입정보 이미지를 Ctrl+V 하면 AI가 자동 분석합니다.
          </p>
        </div>
      </div>

      {/* 선택된 고객 정보 (읽기 전용) */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-base font-bold">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(customer.birth_date)}
                {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                {customer.gender && ` · ${formatGender(customer.gender)}`}
                {customer.phone && ` · ${formatPhone(customer.phone)}`}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="mr-2 h-3.5 w-3.5" />
            다른 고객 선택
          </Button>
        </CardContent>
      </Card>

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
        <input type="hidden" {...register("customer_id")} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🚗 자동차보험 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="만기 갱신일 (MM-DD) *" error={errors.갱신일?.message}>
                <Input {...register("갱신일")} placeholder="03-15" />
              </Field>
              <Field label="상태">
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
            <Field label="메모">
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

      <CustomerSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={selectCustomer}
        title="자동차보험을 등록할 고객 선택"
      />

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
