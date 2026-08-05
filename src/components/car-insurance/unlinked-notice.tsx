"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, UserPlus, Link2, ArrowLeft, Loader2 } from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

type RawCarInsuranceData = {
  등록번호: string
  고객명?: string | null
  생년월일?: string | null
  주민번호뒷자리?: string | null
  연락처?: string | null
  갱신일?: string | null
  차량정보?: string | null
  상태?: string | null
}

type Props = {
  raw: RawCarInsuranceData
}

export function UnlinkedCarInsuranceNotice({ raw }: Props) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [linking, setLinking] = useState(false)

  const prefillQuery = new URLSearchParams({
    car_insurance_id: raw.등록번호,
    ...(raw.고객명 ? { name: raw.고객명 } : {}),
    ...(raw.생년월일 ? { birth_date: raw.생년월일 } : {}),
    ...(raw.주민번호뒷자리 ? { ssn_back: raw.주민번호뒷자리 } : {}),
    ...(raw.연락처 ? { phone: raw.연락처 } : {}),
  }).toString()

  const handleSelectExistingCustomer = async (customer: Customer) => {
    setLinking(true)
    try {
      const res = await fetch(`/api/car-insurance/${raw.등록번호}/link-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customer.id }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "고객 연결 실패")
      }

      toast.success(`${customer.name} 고객과 자동차보험 정보가 연결되었습니다!`)
      setSearchOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "고객 연결 중 오류가 발생했습니다")
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">자동차보험 고객 연동 필요</h1>
      </div>

      <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-900 dark:text-amber-200">
                연결된 고객 정보가 없습니다
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                해당 자동차보험 데이터를 수정하기 위해 먼저 고객(Customer) 레코드와 연결해야 합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background p-4 text-sm space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground font-medium">등록번호</span>
              <span className="font-mono font-bold">{raw.등록번호}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-muted-foreground text-xs block">기록된 고객명</span>
                <span className="font-medium">{raw.고객명 || "(없음)"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">연락처</span>
                <span className="font-medium">{raw.연락처 || "(없음)"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">생년월일/사업자번호</span>
                <span className="font-medium">{raw.생년월일 || "(없음)"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">갱신일</span>
                <Badge variant="outline">{raw.갱신일 || "미지정"}</Badge>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href={`/admin/customers/new?${prefillQuery}`} className="flex-1">
              <Button className="w-full" size="lg">
                <UserPlus className="mr-2 h-4 w-4" />
                신규 고객 등록 후 연동
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => setSearchOpen(true)}
              disabled={linking}
            >
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              기존 고객 검색 후 연결
            </Button>
          </div>
        </CardContent>
      </Card>

      <CustomerSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={handleSelectExistingCustomer}
      />
    </div>
  )
}
