import { SupabaseClient } from "@supabase/supabase-js"
import { CustomerRepository } from "@/lib/repositories/customer-repository"
import type { CustomerCreate, CustomerUpdate, CustomerSearch } from "@/lib/validators/customer-schema"

export class CustomerService {
  private repository: CustomerRepository

  constructor(supabase: SupabaseClient) {
    this.repository = new CustomerRepository(supabase)
  }

  async getCustomers(params: CustomerSearch) {
    return this.repository.findAll(params)
  }

  async getCustomerById(id: string) {
    return this.repository.findById(id)
  }

  async getFamilyMembers(familyGroupId: string) {
    return this.repository.findByFamilyGroupId(familyGroupId)
  }

  async createCustomer(data: CustomerCreate, createdBy?: string) {
    const cleaned = {
      ...data,
      email: data.email === "" ? null : data.email,
      phone: data.phone ? data.phone.replace(/[^\d-]/g, "") : null,
      phone_2: data.phone_2 ? data.phone_2.replace(/[^\d-]/g, "") : null,
    }
    return this.repository.create(cleaned, createdBy)
  }

  async updateCustomer(id: string, data: CustomerUpdate) {
    const cleaned = {
      ...data,
      email: data.email === "" ? null : data.email,
      phone: data.phone ? data.phone.replace(/[^\d-]/g, "") : null,
      phone_2: data.phone_2 ? data.phone_2.replace(/[^\d-]/g, "") : null,
    }
    return this.repository.update(id, cleaned)
  }

  async deleteCustomer(id: string) {
    return this.repository.delete(id)
  }

  async getTotalCount() {
    return this.repository.count()
  }
}
