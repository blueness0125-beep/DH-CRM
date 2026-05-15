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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import {
  Save,
  Loader2,
  Upload,
  X,
  ImageIcon,
  FileText,
  Search,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import { ContractInlineDialog, type ContractDraft } from "./contract-inline-dialog"
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

type EditPrefill = {
  등록번호: string
  customer: Customer
  관계인: string | null
  갱신일: string | null
  상태: string | null
  차량정보: string | null
  비교내용: string | null
  메모: string | null
  가입정보경로: string | null
  비교표경로: string | null
  이미지경로: string | null
}

type Props = {
  mode?: "create" | "edit"
  edit?: EditPrefill
}

function splitUrls(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split("\n").map((s) => s.trim()).filter(Boolean)
}

export function NewCarInsuranceForm({ mode = "create", edit }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCustomerId = searchParams.get("customer_id")
  const isEdit = mode === "edit" && !!edit

  const [customer, setCustomer] = useState<Customer | null>(edit?.customer ?? null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [activeZone, setActiveZone] = useState<ZoneId>("main")
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingOther, setUploadingOther] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [saving, setSaving] = useState(false)

  const initialMainUrl = isEdit ? edit?.가입정보경로 ?? "" : ""
  const initialPdfUrls = isEdit ? splitUrls(edit?.비교표경로) : []
  const initialOtherUrls = isEdit ? splitUrls(edit?.이미지경로) : []

  const [mainUrl, setMainUrl] = useState<string>(initialMainUrl)
  const [pdfUrls, setPdfUrls] = useState<string[]>(initialPdfUrls)
  const [otherUrls, setOtherUrls] = useState<string[]>(initialOtherUrls)

  const [pendingItems, setPendingItems] = useState<GeminiExtractItem[]>([])
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false)

  const [contracts, setContracts] = useState<ContractDraft[]>([])
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [editingContractIdx, setEditingContractIdx] = useState<number | null>(null)

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
      상태: (edit?.상태 as (typeof STATUS_OPTIONS)[number]) ?? STATUS_OPTIONS[0],
      customer_id: edit?.customer.id ?? prefilledCustomerId ?? undefined,
      관계인: edit?.관계인 ?? "",
      갱신일: edit?.갱신일 ?? "",
      차량정보: edit?.차량정보 ?? "",
      비교내용: edit?.비교내용 ?? "",
      메모: edit?.메모 ?? "",
    },
  })

  const watchedStatus = watch("상태")

  useEffect(() => {
    if (isEdit) return
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
  }, [prefilledCustomerId, setValue, isEdit])

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

  function openContractAdd() {
    setEditingContractIdx(null)
    setContractDialogOpen(true)
  }

  function openContractEdit(idx: number) {
    setEditingContractIdx(idx)
    setContractDialogOpen(true)
  }

  function handleContractSave(draft: ContractDraft) {
    if (editingContractIdx == null) {
      setContracts((prev) => [...prev, draft])
    } else {
      setContracts((prev) => prev.map((c, i) => (i === editingContractIdx ? draft : c)))
    }
    setContractDialogOpen(false)
    setEditingContractIdx(null)
  }

  function handleContractDelete(idx: number) {
    setContracts((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (form: CarInsuranceRegistration) => {
    if (!customer && !isEdit) {
      toast.error("고객을 먼저 선택해주세요")
      return
    }
    setSaving(true)
    try {
      const sharedPayload = {
        ...form,
        가입정보경로: mainUrl || null,
        비교표경로: pdfUrls.length ? pdfUrls.join("\n") : null,
        이미지경로: otherUrls.length ? otherUrls.join("\n") : null,
      }

      if (isEdit) {
        const { customer_id: _ci, contracts: _ctr, ...rest } = sharedPayload
        void _ci
        void _ctr
        const res = await fetch(`/api/car-insurance/${edit!.등록번호}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(typeof body.error === "string" ? body.error : "수정 실패")
          return
        }
        toast.success("자동차보험 정보 수정 완료")
        router.push(`/admin/customers/${edit!.customer.id}`)
      } else {
        const payload = { ...sharedPayload, contracts }
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
        toast.success(`자동차보험 신규 등록 완료${contracts.length ? ` (계약 ${contracts.length}건 포함)` : ""}`)
        router.push(`/admin/customers/${customer!.id}`)
      }
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "자동차보험 정보 수정" : "자동차보험 신규 등록"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {!customer
              ? "먼저 자동차보험을 등록할 기존 고객을 선택해주세요."
              : isEdit
                ? "자동차보험 정보를 수정합니다."
                : "탭 1에서 가입 정보를 paste하거나, 탭 2에서 계약을 바로 입력할 수 있습니다."}
          </p>
        </div>
      </div>

      {!customer ? (
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
      ) : (
        <>
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-base font-bold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(customer.birth_date)}
                    {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                    {customer.ssn_back && ` · ${customer.ssn_back}`}
                    {customer.gender && ` · ${formatGender(customer.gender)}`}
                    {customer.phone && ` · ${formatPhone(customer.phone)}`}
                  </p>
                </div>
              </div>
              {!isEdit && (
                <Button type="button" variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
                  <Search className="mr-2 h-3.5 w-3.5" />
                  다른 고객 선택
                </Button>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("customer_id")} />

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">자동차보험 정보</TabsTrigger>
                <TabsTrigger value="contract">
                  계약 정보 {contracts.length > 0 && `(${contracts.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
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
                                <a href={u} target="_blank" rel="noreferrer" className="hover:underline">
                                  파일 {i + 1}
                                </a>
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
                                  <a href={u} target="_blank" rel="noreferrer" className="hover:underline">
                                    이미지 {i + 1}
                                  </a>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🚗 자동차보험 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field
                        label="만기 갱신일 (MM-DD) — 비워두면 계약 정보에서 자동 추출"
                        error={errors.갱신일?.message}
                      >
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
                    <Field label="차량 정보 (AI 자동 입력 / 자유 편집)">
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
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">📜 계약 정보</CardTitle>
                    {!isEdit && (
                      <Button type="button" size="sm" onClick={openContractAdd}>
                        <Plus className="mr-1 h-4 w-4" />
                        계약 추가
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEdit ? (
                      <p className="text-sm text-muted-foreground">
                        계약은 자동차보험 갱신 메뉴에서 추가/수정/삭제할 수 있습니다.
                      </p>
                    ) : contracts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        아직 입력된 계약이 없습니다. [계약 추가] 버튼으로 신차/중고차/갱신 계약을 입력하세요. 차량번호 대신 차대번호만 입력해도 됩니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {contracts.map((c, i) => (
                          <ContractCard
                            key={i}
                            index={i}
                            contract={c}
                            onEdit={() => openContractEdit(i)}
                            onDelete={() => handleContractDelete(i)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? "수정" : "저장"}
              </Button>
            </div>
          </form>
        </>
      )}

      <CustomerSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={selectCustomer}
        title="자동차보험을 등록할 고객 선택"
      />

      <ContractInlineDialog
        open={contractDialogOpen}
        onOpenChange={setContractDialogOpen}
        defaultCustomerName={customer?.name ?? ""}
        existingVehicleNumbers={collectVehicleNumbersFromText(watch("차량정보") ?? "")}
        initial={editingContractIdx != null ? contracts[editingContractIdx] : null}
        onSave={handleContractSave}
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

function collectVehicleNumbersFromText(text: string): string[] {
  if (!text) return []
  return [...text.matchAll(/차량번호[:\s]+(.+)/g)].map((m) => m[1].trim()).filter(Boolean)
}

function ContractCard({
  index,
  contract,
  onEdit,
  onDelete,
}: {
  index: number
  contract: ContractDraft
  onEdit: () => void
  onDelete: () => void
}) {
  const vehicleLabel = contract.차량번호 || (contract.차대번호 ? `차대 ${contract.차대번호}` : "차량 미입력")
  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">계약 {index + 1}</Badge>
          <span className="text-sm font-medium">{vehicleLabel}</span>
          <span className="text-xs text-muted-foreground">
            {contract.보험사} · {contract.채널}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          시작 {contract.시작일 ?? "-"} / 만기 {contract.만기일 ?? "-"}
          {contract.가입보험료 != null && ` · ${contract.가입보험료.toLocaleString()}원`}
          {contract.증권번호 && ` · ${contract.증권번호}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
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
