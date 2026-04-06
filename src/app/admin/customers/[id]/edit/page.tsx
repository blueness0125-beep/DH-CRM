import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerService } from "@/lib/services/customer-service"
import { CustomerForm } from "@/components/customers/customer-form"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const service = new CustomerService(supabase)

  try {
    const customer = await service.getCustomerById(id)
    return <CustomerForm customer={customer} mode="edit" />
  } catch {
    notFound()
  }
}
