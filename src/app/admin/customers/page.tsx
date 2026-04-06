import { Suspense } from "react"
import { CustomerListContainer } from "@/components/customers/customer-list-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<CustomerListSkeleton />}>
        <CustomerListContainer />
      </Suspense>
    </div>
  )
}

function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
