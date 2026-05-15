"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  BookOpen,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Users,
  Car,
  Plus,
  ExternalLink,
} from "lucide-react"
import { formatPhone, formatDate, calculateAge, formatGender } from "@/lib/utils/format"
import { FamilyGroupSection } from "@/components/customers/family-group-section"
import { RelatedPersonsSection } from "@/components/customers/related-persons-section"
import { ConsultationLogSection } from "@/components/customers/consultation-log-section"
import { ConsultationLogForm } from "@/components/customers/consultation-log-form"
import type { Customer, CarInsurance } from "@/types/customer"
import type { CarInsuranceContract } from "@/types/car-insurance"

type CustomerDetailProps = {
  customer: Customer & { car_insurance_data?: CarInsurance[] }
  familyMembers: Customer[] | null
}

function GridCell({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value && value !== "-" ? (
        href ? (
          <a href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">-</p>
      )}
    </div>
  )
}

function Row({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {href ? (
        <a href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  )
}

function todayLocalString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatWon(n: number | null): string {
  if (n == null) return "-"
  return n.toLocaleString("ko-KR") + "원"
}

function splitUrlList(value: string | null | undefined): string[] {
  if (!value) return []
  return value.split("\n").map((s) => s.trim()).filter(Boolean)
}

export function CustomerDetail({ customer, familyMembers }: CustomerDetailProps) {
  const router = useRouter()
  const isCorporate = customer.customer_type === "corporate"
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const carInsuranceList = customer.car_insurance_data ?? []
  const todayStr = todayLocalString()

  const hasWorkInfo =
    customer.work_company_name ||
    customer.work_address ||
    customer.job_category ||
    customer.job_name ||
    customer.job_risk_grade

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/admin/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              {customer.name}
              {isCorporate && <span className="ml-2 text-sm font-normal text-muted-foreground">(법인)</span>}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {isCorporate ? (
                <>사업자등록번호: {customer.business_number ?? "-"}</>
              ) : (
                <>
                  {formatDate(customer.birth_date)}
                  {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                  {customer.gender && ` · ${formatGender(customer.gender)}`}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsFormOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            상담일지
          </Button>
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      {customer.phone && (
        <div className="flex gap-2 md:hidden">
          <a href={`tel:${customer.phone}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              전화
            </Button>
          </a>
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                이메일
              </Button>
            </a>
          )}
        </div>
      )}

      <ConsultationLogSection customerId={customer.id} refreshKey={refreshKey} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 통합 개인 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {isCorporate ? "법인 정보" : "개인 정보"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCorporate ? (
              <>
                <GridCell label="사업자등록번호" value={customer.business_number ?? ""} />
                <GridCell label="전화번호" value={formatPhone(customer.phone)} href={customer.phone ? `tel:${customer.phone}` : undefined} />
                <GridCell label="전화번호 2" value={formatPhone(customer.phone_2)} href={customer.phone_2 ? `tel:${customer.phone_2}` : undefined} />
                <GridCell label="이메일" value={customer.email ?? ""} href={customer.email ? `mailto:${customer.email}` : undefined} />
              </>
            ) : (
              <>
                {/* 2x2 그리드: 생년월일 / 주민번호 뒷자리 / 성별 / 전화번호 */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <GridCell label="생년월일" value={formatDate(customer.birth_date)} />
                  <GridCell label="주민번호 뒷자리" value={customer.ssn_back ?? ""} />
                  <GridCell label="성별" value={formatGender(customer.gender)} />
                  <GridCell
                    label="전화번호"
                    value={formatPhone(customer.phone)}
                    href={customer.phone ? `tel:${customer.phone}` : undefined}
                  />
                </div>
                {(customer.phone_2 || customer.email) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                    {customer.phone_2 && (
                      <GridCell
                        label="전화번호 2"
                        value={formatPhone(customer.phone_2)}
                        href={`tel:${customer.phone_2}`}
                      />
                    )}
                    {customer.email && (
                      <GridCell label="이메일" value={customer.email} href={`mailto:${customer.email}`} />
                    )}
                  </div>
                )}
              </>
            )}

            {/* 자택 주소 */}
            <div className="space-y-1.5 border-t pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                자택 주소
              </p>
              {customer.home_address ? (
                <div className="space-y-0.5">
                  {customer.home_zonecode && (
                    <p className="text-xs text-muted-foreground">{customer.home_zonecode}</p>
                  )}
                  <p className="text-sm">{customer.home_address}</p>
                  {customer.home_address_detail && (
                    <p className="text-sm">{customer.home_address_detail}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">등록된 주소 없음</p>
              )}
            </div>

            {/* 직장 정보 (개인) / 법인 주소 (법인) */}
            {(hasWorkInfo || isCorporate) && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {isCorporate ? "법인 주소" : "직장 정보"}
                </p>
                {!isCorporate && customer.work_company_name && (
                  <Row label="회사명" value={customer.work_company_name} />
                )}
                {customer.work_address && (
                  <div className="space-y-0.5 py-1">
                    <span className="text-xs text-muted-foreground">
                      {isCorporate ? "주소" : "직장 주소"}
                    </span>
                    {customer.work_zonecode && (
                      <p className="text-xs text-muted-foreground">{customer.work_zonecode}</p>
                    )}
                    <p className="text-sm">{customer.work_address}</p>
                    {customer.work_address_detail && (
                      <p className="text-sm">{customer.work_address_detail}</p>
                    )}
                  </div>
                )}
                {!isCorporate && (
                  <>
                    <Row label="직업 분류" value={customer.job_category} />
                    <Row label="직업명" value={customer.job_name} />
                    <Row label="위험등급" value={customer.job_risk_grade} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 계좌 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Row label="은행" value={customer.bank_name} />
            <Row label="계좌번호" value={customer.bank_account} />
            <Row label="예금주" value={customer.bank_holder} />
            {!customer.bank_name && !customer.bank_account && (
              <p className="text-sm text-muted-foreground">등록된 계좌 없음</p>
            )}
          </CardContent>
        </Card>

        {/* 자동차보험 — 다중 row 노출 (차량별로 갱신일이 다를 수 있음) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              자동차보험
              {carInsuranceList.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {carInsuranceList.length}건
                </Badge>
              )}
            </CardTitle>
            <Link href={`/admin/car-insurance/new?customer_id=${customer.id}`}>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-3.5 w-3.5" />
                자동차보험 등록
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {carInsuranceList.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 자동차보험 정보가 없습니다.</p>
            ) : (
              carInsuranceList.map((ci, idx) => (
                <CarInsuranceRowBlock
                  key={ci.등록번호}
                  carInsurance={ci}
                  index={idx}
                  total={carInsuranceList.length}
                  todayStr={todayStr}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* 메모 */}
        {customer.memo && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{customer.memo}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Family & Relationships */}
      <Separator />
      <FamilyGroupSection
        customer={customer}
        familyMembers={familyMembers ?? []}
      />
      <RelatedPersonsSection customerId={customer.id} />

      <ConsultationLogForm
        customerId={customer.id}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  )
}

function CarInsuranceRowBlock({
  carInsurance,
  index,
  total,
  todayStr,
}: {
  carInsurance: CarInsurance
  index: number
  total: number
  todayStr: string
}) {
  const activeContracts: CarInsuranceContract[] = (carInsurance.car_insurance_contracts ?? []).filter(
    (c) => !c.만기일 || c.만기일 >= todayStr,
  )
  const policyDocUrls = splitUrlList(carInsurance.가입정보경로)
  const compareDocUrls = splitUrlList(carInsurance.비교표경로)
  const otherImageUrls = splitUrlList(carInsurance.이미지경로)

  return (
    <div className="rounded-lg border bg-background p-3 space-y-3">
      {total > 1 && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
          <Link
            href={`/admin/car-insurance/edit/${carInsurance.등록번호}`}
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            정보 수정
          </Link>
        </div>
      )}

      {/* 기본 정보: 갱신일/상태/관계인/등록번호 — 2x2 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
        <GridCell label="갱신일 (MM-DD)" value={carInsurance.갱신일 ?? "-"} />
        <GridCell label="상태" value={carInsurance.상태 ?? "-"} />
        <GridCell label="관계인" value={carInsurance.관계인 ?? "-"} />
        <GridCell label="등록번호" value={carInsurance.등록번호} />
      </div>

      {carInsurance.차량정보 && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">차량 정보</p>
          <p className="whitespace-pre-wrap text-sm">{carInsurance.차량정보}</p>
        </div>
      )}

      {activeContracts.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">
            계약 완료 ({activeContracts.length}건)
          </p>
          <div className="space-y-2">
            {activeContracts.map((c) => (
              <div key={c.id} className="rounded-md border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
                  <GridCell label="가입일" value={c.시작일 ?? "-"} />
                  <GridCell label="만기일" value={c.만기일 ?? "-"} />
                  <GridCell label="보험사" value={c.보험사 ?? "-"} />
                  <GridCell label="채널" value={c.채널 ?? "-"} />
                  <GridCell label="차량번호" value={c.차량번호 ?? "-"} />
                  <GridCell label="차대번호" value={c.차대번호 ?? "-"} />
                  <GridCell label="증권번호" value={c.증권번호 ?? "-"} />
                  <GridCell label="가입보험료" value={formatWon(c.가입보험료)} />
                </div>
                {(c.피보험자 || c.계약자 || c.설계자) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
                    {c.피보험자 && <span>피보험자: {c.피보험자}</span>}
                    {c.계약자 && <span>계약자: {c.계약자}</span>}
                    {c.설계자 && <span>설계자: {c.설계자}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {carInsurance.비교내용 && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">비교 분석 내용</p>
          <p className="whitespace-pre-wrap text-sm">{carInsurance.비교내용}</p>
        </div>
      )}

      {carInsurance.메모 && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">메모</p>
          <p className="whitespace-pre-wrap text-sm">{carInsurance.메모}</p>
        </div>
      )}

      {(policyDocUrls.length > 0 || compareDocUrls.length > 0 || otherImageUrls.length > 0) && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">첨부 파일</p>
          <div className="flex flex-wrap gap-2">
            {policyDocUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  가입정보 {i + 1}
                </Badge>
              </a>
            ))}
            {compareDocUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  비교표 {i + 1}
                </Badge>
              </a>
            ))}
            {otherImageUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  기타 이미지 {i + 1}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
