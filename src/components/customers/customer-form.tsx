"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Save, Loader2, Search, Link2, Users, UserPlus, Plus, X } from "lucide-react"
import { AddressSearchButton, type AddressResult } from "@/components/shared/address-search-dialog"
import { OccupationSearchDialog } from "@/components/shared/occupation-search-dialog"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import { FamilyGroupSection } from "@/components/customers/family-group-section"
import { RelatedPersonsSection } from "@/components/customers/related-persons-section"
import { customerCreateSchema, type CustomerCreate } from "@/lib/validators/customer-schema"
import type { Occupation } from "@/lib/data/occupations"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

const FAMILY_RELATIONSHIP_TYPES = ["배우자", "자녀", "부모", "형제", "친척"]
const RELATIONSHIP_TYPES = ["지인", "소개인", "동료", "기타"]

const INVERSE_TYPE: Record<string, string> = {
  자녀: "부모",
  부모: "자녀",
  배우자: "배우자",
  형제: "형제",
  친척: "친척",
}

type PendingFamily = {
  customer: Customer
  relationshipType: string
}

type PendingRelation = {
  customer: Customer
  relationshipType: string
}

type CustomerFormProps = {
  customer?: Customer
  mode: "create" | "edit"
  familyMembers?: Customer[]
}

export function CustomerForm({ customer, mode, familyMembers = [] }: CustomerFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [occupationSearchOpen, setOccupationSearchOpen] = useState(false)

  // create 모드 - 가족 임시 목록
  const [pendingFamily, setPendingFamily] = useState<PendingFamily[]>([])
  const [famSearchOpen, setFamSearchOpen] = useState(false)
  const [famTypeDialogOpen, setFamTypeDialogOpen] = useState(false)
  const [famSelectedMember, setFamSelectedMember] = useState<Customer | null>(null)
  const [famSelectedType, setFamSelectedType] = useState("")

  // create 모드 - 관계인 임시 목록
  const [pendingRelations, setPendingRelations] = useState<PendingRelation[]>([])
  const [relSearchOpen, setRelSearchOpen] = useState(false)
  const [relTypeDialogOpen, setRelTypeDialogOpen] = useState(false)
  const [relSelectedCustomer, setRelSelectedCustomer] = useState<Customer | null>(null)
  const [relSelectedType, setRelSelectedType] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CustomerCreate>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: customer
      ? {
          name: customer.name,
          customer_type: customer.customer_type ?? "individual",
          business_number: customer.business_number ?? "",
          // 법인은 사업자등록번호를 같은 입력칸에 표시
          birth_date: customer.customer_type === "corporate"
            ? (customer.business_number ?? "")
            : (customer.birth_date ?? ""),
          ssn_back: customer.ssn_back ?? "",
          gender: customer.gender as "M" | "F" | undefined,
          phone: customer.phone ?? "",
          phone_2: customer.phone_2 ?? "",
          email: customer.email ?? "",
          home_address: customer.home_address ?? "",
          home_address_detail: customer.home_address_detail ?? "",
          home_zonecode: customer.home_zonecode ?? "",
          work_address: customer.work_address ?? "",
          work_address_detail: customer.work_address_detail ?? "",
          work_zonecode: customer.work_zonecode ?? "",
          work_company_name: customer.work_company_name ?? "",
          job_category: customer.job_category ?? "",
          job_name: customer.job_name ?? "",
          job_risk_grade: customer.job_risk_grade ?? "",
          bank_name: customer.bank_name ?? "",
          bank_account: customer.bank_account ?? "",
          bank_holder: customer.bank_holder ?? "",
          memo: customer.memo ?? "",
        }
      : { name: "", customer_type: "individual" },
  })

  // 생년월일/사업자등록번호 입력값 감시해서 법인/개인 모드 자동 판정
  const birthOrBizValue = useWatch({ control, name: "birth_date" }) ?? ""
  const BIZ_NUMBER_RE = /^\d{3}-\d{2}-\d{5}$/
  const isCorporate = BIZ_NUMBER_RE.test(birthOrBizValue)

  async function onSubmit(data: CustomerCreate) {
    setSaving(true)
    try {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customer?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      // 입력된 값이 사업자등록번호 형식이면 법인으로 저장
      const payload = BIZ_NUMBER_RE.test(data.birth_date ?? "")
        ? {
            ...data,
            customer_type: "corporate" as const,
            business_number: data.birth_date,
            birth_date: null,
            ssn_back: null,
            gender: null,
            job_category: null,
            job_name: null,
            job_risk_grade: null,
          }
        : { ...data, customer_type: "individual" as const, business_number: null }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        const newCustomerId = json.data.id

        if (mode === "create" && pendingFamily.length > 0) {
          await fetch("/api/family-groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${data.name} 가족`,
              member_ids: [newCustomerId, ...pendingFamily.map((f) => f.customer.id)],
              primary_id: newCustomerId,
            }),
          })
          await Promise.allSettled(
            pendingFamily.map((f) =>
              fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_id: newCustomerId,
                  related_customer_id: f.customer.id,
                  relationship_type: f.relationshipType,
                }),
              })
            )
          )
        }

        if (mode === "create" && pendingRelations.length > 0) {
          await Promise.allSettled(
            pendingRelations.map((r) =>
              fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_id: newCustomerId,
                  related_customer_id: r.customer.id,
                  relationship_type: r.relationshipType,
                }),
              })
            )
          )
        }

        toast.success(mode === "create" ? "고객이 등록되었습니다" : "고객 정보가 수정되었습니다")
        router.push(`/admin/customers/${newCustomerId}`)
        router.refresh()
      } else {
        toast.error("저장에 실패했습니다")
      }
    } catch {
      toast.error("저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  function handleHomeAddress(result: AddressResult) {
    setValue("home_zonecode", result.zonecode)
    setValue("home_address", result.address)
  }

  function handleWorkAddress(result: AddressResult) {
    setValue("work_zonecode", result.zonecode)
    setValue("work_address", result.address)
  }

  function handleOccupationSelect(occupation: Occupation) {
    setValue("job_category", occupation.category)
    setValue("job_name", occupation.name)
    setValue("job_risk_grade", occupation.riskGrade)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "고객 등록" : "고객 수정"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">{isCorporate ? "법인명 *" : "이름 *"}</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">
                {isCorporate ? "사업자등록번호" : "생년월일"}
              </Label>
              <Input
                id="birth_date"
                placeholder="YYYY-MM-DD 또는 000-00-00000"
                {...register("birth_date")}
              />
              <p className="text-xs text-muted-foreground">
                사업자등록번호 형식(000-00-00000)을 입력하면 법인으로 등록됩니다.
              </p>
            </div>
            {!isCorporate && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ssn_back">주민번호 뒷자리</Label>
                  <Input id="ssn_back" maxLength={7} placeholder="1234567" {...register("ssn_back")} />
                </div>
                <div className="space-y-2">
                  <Label>성별</Label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="M" {...register("gender")} className="accent-primary" />
                      <span className="text-sm">남</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="F" {...register("gender")} className="accent-primary" />
                      <span className="text-sm">여</span>
                    </label>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">{isCorporate ? "대표 전화번호" : "전화번호"}</Label>
              <Input id="phone" placeholder="010-0000-0000" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_2">전화번호 2</Label>
              <Input id="phone_2" placeholder="010-0000-0000" {...register("phone_2")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주소 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">자택 주소</Label>
                <AddressSearchButton onSelect={handleHomeAddress} />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Input placeholder="우편번호" {...register("home_zonecode")} />
                <Input placeholder="주소" className="sm:col-span-2" {...register("home_address")} />
              </div>
              <Input className="mt-2" placeholder="상세주소" {...register("home_address_detail")} />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">직장 주소</Label>
                <AddressSearchButton onSelect={handleWorkAddress} />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Input placeholder="우편번호" {...register("work_zonecode")} />
                <Input placeholder="주소" className="sm:col-span-2" {...register("work_address")} />
              </div>
              <Input className="mt-2" placeholder="상세주소" {...register("work_address_detail")} />
              <Input className="mt-2" placeholder="회사명" {...register("work_company_name")} />
            </div>
          </CardContent>
        </Card>

        {/* Job Info - 법인은 숨김 */}
        {!isCorporate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">직업 정보</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => setOccupationSearchOpen(true)}>
                  <Search className="mr-1 h-3.5 w-3.5" />
                  직업 검색
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="job_category">직업 대분류</Label>
                <Input id="job_category" {...register("job_category")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_name">직업명</Label>
                <Input id="job_name" {...register("job_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_risk_grade">위험등급</Label>
                <Input id="job_risk_grade" placeholder="1급, 2급, 3급" {...register("job_risk_grade")} />
              </div>
            </CardContent>
          </Card>
        )}

        <OccupationSearchDialog
          open={occupationSearchOpen}
          onOpenChange={setOccupationSearchOpen}
          onSelect={(occupation) => {
            handleOccupationSelect(occupation)
            setOccupationSearchOpen(false)
          }}
        />

        {/* Bank Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">계좌 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bank_name">은행명</Label>
              <Input id="bank_name" {...register("bank_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">계좌번호</Label>
              <Input id="bank_account" {...register("bank_account")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_holder">예금주</Label>
              <Input id="bank_holder" {...register("bank_holder")} />
            </div>
          </CardContent>
        </Card>

        {/* Memo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">메모</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} placeholder="고객 관련 메모..." {...register("memo")} />
          </CardContent>
        </Card>

        {/* Family - create mode only */}
        {mode === "create" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4" />
                가족 구성원
                {pendingFamily.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{pendingFamily.length}</Badge>
                )}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFamSearchOpen(true)}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                가족 추가
              </Button>
            </CardHeader>
            <CardContent>
              {pendingFamily.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록할 가족 구성원을 추가하세요</p>
              ) : (
                <div className="space-y-2">
                  {pendingFamily.map((f) => (
                    <div
                      key={f.customer.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{f.customer.name}</p>
                        <Badge variant="outline" className="text-xs">{f.relationshipType}</Badge>
                        {INVERSE_TYPE[f.relationshipType] && (
                          <span className="text-xs text-muted-foreground">
                            ({f.customer.name}님 기준: {INVERSE_TYPE[f.relationshipType]})
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setPendingFamily((prev) => prev.filter((x) => x.customer.id !== f.customer.id))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Relationships - create mode only */}
        {mode === "create" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-4 w-4" />
                관계인
                {pendingRelations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{pendingRelations.length}</Badge>
                )}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRelSearchOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                관계인 추가
              </Button>
            </CardHeader>
            <CardContent>
              {pendingRelations.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록할 관계인을 추가하세요</p>
              ) : (
                <div className="space-y-2">
                  {pendingRelations.map((r) => (
                    <div
                      key={r.customer.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{r.customer.name}</p>
                        <Badge variant="outline" className="text-xs">{r.relationshipType}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setPendingRelations((prev) => prev.filter((x) => x.customer.id !== r.customer.id))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {mode === "create" ? "등록" : "저장"}
          </Button>
        </div>
      </form>

      {/* Dialogs for create mode */}
      {mode === "create" && (
        <>
          <CustomerSearchDialog
            open={famSearchOpen}
            onOpenChange={setFamSearchOpen}
            onSelect={(customer) => {
              setFamSelectedMember(customer)
              setFamSearchOpen(false)
              setFamTypeDialogOpen(true)
            }}
            excludeIds={pendingFamily.map((f) => f.customer.id)}
            title="가족 추가"
          />
          <Dialog open={famTypeDialogOpen} onOpenChange={setFamTypeDialogOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>가족 관계 설정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {famSelectedMember && (
                  <p className="text-sm">
                    <span className="font-medium">{famSelectedMember.name}</span>님은 나의
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {FAMILY_RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFamSelectedType(type)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        famSelectedType === type
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFamTypeDialogOpen(false)
                    setFamSelectedMember(null)
                    setFamSelectedType("")
                  }}
                >
                  취소
                </Button>
                <Button
                  disabled={!famSelectedType}
                  onClick={() => {
                    if (!famSelectedMember || !famSelectedType) return
                    setPendingFamily((prev) => [
                      ...prev,
                      { customer: famSelectedMember, relationshipType: famSelectedType },
                    ])
                    setFamTypeDialogOpen(false)
                    setFamSelectedMember(null)
                    setFamSelectedType("")
                  }}
                >
                  추가
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CustomerSearchDialog
            open={relSearchOpen}
            onOpenChange={setRelSearchOpen}
            onSelect={(customer) => {
              setRelSelectedCustomer(customer)
              setRelSearchOpen(false)
              setRelTypeDialogOpen(true)
            }}
            excludeIds={pendingRelations.map((r) => r.customer.id)}
            title="관계인 검색"
          />
          <Dialog open={relTypeDialogOpen} onOpenChange={setRelTypeDialogOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>관계 설정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {relSelectedCustomer && (
                  <p className="text-sm">
                    <span className="font-medium">{relSelectedCustomer.name}</span>님과의 관계를 선택해주세요
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRelSelectedType(type)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        relSelectedType === type
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRelTypeDialogOpen(false)
                    setRelSelectedCustomer(null)
                    setRelSelectedType("")
                  }}
                >
                  취소
                </Button>
                <Button
                  disabled={!relSelectedType}
                  onClick={() => {
                    if (!relSelectedCustomer || !relSelectedType) return
                    setPendingRelations((prev) => [
                      ...prev,
                      { customer: relSelectedCustomer, relationshipType: relSelectedType },
                    ])
                    setRelTypeDialogOpen(false)
                    setRelSelectedCustomer(null)
                    setRelSelectedType("")
                  }}
                >
                  추가
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Family & Relationships - edit mode only */}
      {mode === "edit" && customer && (
        <>
          <Separator />
          <FamilyGroupSection customer={customer} familyMembers={familyMembers} />
          <RelatedPersonsSection customerId={customer.id} />
        </>
      )}
    </div>
  )
}
