import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { NewCarInsuranceForm } from "@/components/car-insurance/new-registration-form"

export const metadata = {
  title: "자동차보험 신규 등록 | 동행지사",
}

export default function NewCarInsurancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewCarInsuranceForm />
    </Suspense>
  )
}
