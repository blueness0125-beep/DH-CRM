"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Users,
} from "lucide-react"
import { formatPhone, formatDate, calculateAge, formatGender } from "@/lib/utils/format"
import { FamilyGroupSection } from "@/components/customers/family-group-section"
import { RelatedPersonsSection } from "@/components/customers/related-persons-section"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/admin/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{customer.name}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {formatDate(customer.birth_date)}
              {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
              {customer.gender && ` · ${formatGender(customer.gender)}`}
            </p>
          </div>
        </div>
        <Link href={`/admin/customers/${customer.id}/edit`} className="shrink-0">
          <Button size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </Button>
        </Link>
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

        {/* Personal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              개인 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="생년월일" value={formatDate(customer.birth_date)} />
            <InfoRow label="성별" value={formatGender(customer.gender)} />
            <InfoRow label="주민번호 뒷자리" value={customer.ssn_back ?? ""} />
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

        {/* Work Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              직장 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="회사명" value={customer.work_company_name ?? ""} />
            {customer.work_address && (
              <div className="space-y-1 py-2">
                <span className="text-xs text-muted-foreground">직장 주소</span>
                {customer.work_zonecode && (
                  <p className="text-xs text-muted-foreground">{customer.work_zonecode}</p>
                )}
                <p className="text-sm">{customer.work_address}</p>
                {customer.work_address_detail && (
                  <p className="text-sm">{customer.work_address_detail}</p>
                )}
              </div>
            )}
            <InfoRow label="직업 분류" value={customer.job_category ?? ""} />
            <InfoRow label="직업명" value={customer.job_name ?? ""} />
            <InfoRow label="위험등급" value={customer.job_risk_grade ?? ""} />
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
    </div>
  )
}
