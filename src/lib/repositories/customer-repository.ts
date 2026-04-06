import { SupabaseClient } from "@supabase/supabase-js"
import type { CustomerCreate, CustomerUpdate, CustomerSearch } from "@/lib/validators/customer-schema"

export class CustomerRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(params: CustomerSearch) {
    const { query, page, limit, sort, order } = params
    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = this.supabase
      .from("customers")
      .select("*", { count: "exact" })

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,phone.ilike.%${query}%,home_address.ilike.%${query}%,email.ilike.%${query}%`
      )
    }

    const { data, error, count } = await queryBuilder
      .order(sort, { ascending: order === "asc" })
      .range(from, to)

    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  async findByFamilyGroupId(familyGroupId: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("family_group_id", familyGroupId)
      .order("is_primary", { ascending: false })
      .order("birth_date", { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async create(customer: CustomerCreate, createdBy?: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .insert({ ...customer, created_by: createdBy })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, customer: CustomerUpdate) {
    const { data, error } = await this.supabase
      .from("customers")
      .update(customer)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) throw error
  }

  async count() {
    const { count, error } = await this.supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    if (error) throw error
    return count ?? 0
  }
}
