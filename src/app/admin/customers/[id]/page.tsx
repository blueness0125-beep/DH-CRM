import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerService } from "@/lib/services/customer-service"
import { CustomerDetail } from "@/components/customers/customer-detail"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const service = new CustomerService(supabase)

  try {
    const customer = await service.getCustomerById(id)

    let familyMembers = null
    if (customer.family_group_id) {
      familyMembers = await service.getFamilyMembers(customer.family_group_id)
    }

    return <CustomerDetail customer={customer} familyMembers={familyMembers} />
  } catch {
    notFound()
  }
}
