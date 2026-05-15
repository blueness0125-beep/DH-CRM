import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { CarInsuranceRegistrationService } from "@/lib/services/car-insurance-registration-service"
import { NewCarInsuranceForm } from "@/components/car-insurance/new-registration-form"
import type { Customer } from "@/types/customer"

export const metadata = {
  title: "자동차보험 정보 수정 | 동행지사",
}

type Params = { params: Promise<{ id: string }> }

export default async function EditCarInsurancePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const service = new CarInsuranceRegistrationService(supabase)

  let raw
  try {
    raw = await service.findByRegistrationId(id)
  } catch {
    notFound()
  }

  if (!raw || !raw.customers) {
    notFound()
  }

  const edit = {
    등록번호: raw.등록번호 as string,
    customer: raw.customers as Customer,
    관계인: raw.관계인 as string | null,
    갱신일: raw.갱신일 as string | null,
    상태: raw.상태 as string | null,
    차량정보: raw.차량정보 as string | null,
    비교내용: raw.비교내용 as string | null,
    메모: raw.메모 as string | null,
    가입정보경로: raw.가입정보경로 as string | null,
    비교표경로: raw.비교표경로 as string | null,
    이미지경로: raw.이미지경로 as string | null,
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewCarInsuranceForm mode="edit" edit={edit} />
    </Suspense>
  )
}
