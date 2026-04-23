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
} from "lucide-react"
import { formatPhone, formatDate, calculateAge, formatGender } from "@/lib/utils/format"
import { FamilyGroupSection } from "@/components/customers/family-group-section"
import { RelatedPersonsSection } from "@/components/customers/related-persons-section"
import { ConsultationLogSection } from "@/components/customers/consultation-log-section"
import { ConsultationLogForm } from "@/components/customers/consultation-log-form"
import type { Customer } from "@/types/customer"

type CustomerDetailProps = {
  customer: Customer
  familyMembers: Customer[] | null
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value || value === "-") return null
  return (
    <div className="flex flex-col gap-0.5 py-2">
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

export function CustomerDetail({ customer, familyMembers }: CustomerDetailProps) {
  const router = useRouter()
  const isCorporate = customer.customer_type === "corporate"
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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
        {/* Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              연락처
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="전화번호" value={formatPhone(customer.phone)} href={`tel:${customer.phone}`} />
            <InfoRow label="전화번호 2" value={formatPhone(customer.phone_2)} href={`tel:${customer.phone_2}`} />
            <InfoRow label="이메일" value={customer.email ?? ""} href={`mailto:${customer.email}`} />
          </CardContent>
        </Card>

        {/* Personal / Corporate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {isCorporate ? "법인 정보" : "개인 정보"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isCorporate ? (
              <InfoRow label="사업자등록번호" value={customer.business_number ?? ""} />
            ) : (
              <>
                <InfoRow label="생년월일" value={formatDate(customer.birth_date)} />
                <InfoRow label="성별" value={formatGender(customer.gender)} />
                <InfoRow label="주민번호 뒷자리" value={customer.ssn_back ?? ""} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Home Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              자택 주소
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.home_address ? (
              <div className="space-y-1">
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
          </CardContent>
        </Card>

        {/* Work Address - 개인만 직업 정보 표시, 법인은 직장 주소만 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              {isCorporate ? "법인 주소" : "직장 정보"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isCorporate && <InfoRow label="회사명" value={customer.work_company_name ?? ""} />}
            {customer.work_address && (
              <div className="space-y-1 py-2">
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
                <InfoRow label="직업 분류" value={customer.job_category ?? ""} />
                <InfoRow label="직업명" value={customer.job_name ?? ""} />
                <InfoRow label="위험등급" value={customer.job_risk_grade ?? ""} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="은행" value={customer.bank_name ?? ""} />
            <InfoRow label="계좌번호" value={customer.bank_account ?? ""} />
            <InfoRow label="예금주" value={customer.bank_holder ?? ""} />
          </CardContent>
        </Card>

        {/* Car Insurance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              자동차보험
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="갱신일 (월-일)"
              value={((customer as any).car_insurance_data?.[0]?.갱신일) || "미등록"}
            />
            <InfoRow
              label="상태"
              value={((customer as any).car_insurance_data?.[0]?.상태) || "미등록"}
            />
            {((customer as any).car_insurance_data?.[0]?.차량정보) && (
              <div className="py-1">
                <p className="text-xs text-muted-foreground mb-0.5">차량정보</p>
                <p className="text-sm whitespace-pre-wrap">{(customer as any).car_insurance_data[0].차량정보}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memo */}
        {customer.memo && (
          <Card>
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
