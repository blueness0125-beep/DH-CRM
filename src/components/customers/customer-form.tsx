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
import { ArrowLeft, Save, Loader2, Search } from "lucide-react"
import { AddressSearchButton, type AddressResult } from "@/components/shared/address-search-dialog"
import { OccupationSearchDialog } from "@/components/shared/occupation-search-dialog"
import { FamilyGroupSection } from "@/components/customers/family-group-section"
import { RelatedPersonsSection } from "@/components/customers/related-persons-section"
import { customerCreateSchema, type CustomerCreate } from "@/lib/validators/customer-schema"
import type { Occupation } from "@/lib/data/occupations"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

type CustomerFormProps = {
  customer?: Customer
  mode: "create" | "edit"
  familyMembers?: Customer[]
}

export function CustomerForm({ customer, mode, familyMembers = [] }: CustomerFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [occupationSearchOpen, setOccupationSearchOpen] = useState(false)

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
        toast.success(mode === "create" ? "고객이 등록되었습니다" : "고객 정보가 수정되었습니다")
        router.push(`/admin/customers/${json.data.id}`)
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

      {/* Family & Relationships - edit mode only */}
      {mode === "edit" && customer && (
        <>
          <Separator />
          <FamilyGroupSection customer={customer} familyMembers={familyMembers} />
          <RelatedPersonsSection customerId={customer.id} />
        </>
      )}

      {/* Create mode: guide message */}
      {mode === "create" && (
        <p className="text-center text-sm text-muted-foreground">
          저장 후 고객 상세 화면에서 가족 구성원 및 관계인을 설정할 수 있습니다.
        </p>
      )}
    </div>
  )
}
