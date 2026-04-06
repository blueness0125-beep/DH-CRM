import { SupabaseClient } from "@supabase/supabase-js"

export class FamilyRepository {
  constructor(private supabase: SupabaseClient) {}

  async createGroup(name?: string) {
    const { data, error } = await this.supabase
      .from("family_groups")
      .insert({ name: name ?? null })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteGroup(id: string) {
    // First unlink all customers
    await this.supabase
      .from("customers")
      .update({ family_group_id: null, is_primary: false })
      .eq("family_group_id", id)

    const { error } = await this.supabase
      .from("family_groups")
      .delete()
      .eq("id", id)
    if (error) throw error
  }

  async addMemberToGroup(customerId: string, groupId: string, isPrimary: boolean = false) {
    const { error } = await this.supabase
      .from("customers")
      .update({ family_group_id: groupId, is_primary: isPrimary })
      .eq("id", customerId)
    if (error) throw error
  }

  async removeMemberFromGroup(customerId: string) {
    const { error } = await this.supabase
      .from("customers")
      .update({ family_group_id: null, is_primary: false })
      .eq("id", customerId)
    if (error) throw error
  }

  async getGroupMembers(groupId: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("family_group_id", groupId)
      .order("is_primary", { ascending: false })
      .order("birth_date", { ascending: true })
    if (error) throw error
    return data ?? []
  }

  // Relationships
  async createRelationship(customerId: string, relatedCustomerId: string, type: string, note?: string | null) {
    const { data, error } = await this.supabase
      .from("customer_relationships")
      .insert({
        customer_id: customerId,
        related_customer_id: relatedCustomerId,
        relationship_type: type,
        note: note ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteRelationship(id: string) {
    const { error } = await this.supabase
      .from("customer_relationships")
      .delete()
      .eq("id", id)
    if (error) throw error
  }

  async getRelationships(customerId: string) {
    const { data, error } = await this.supabase
      .from("customer_relationships")
      .select("*, related_customer:customers!customer_relationships_related_customer_id_fkey(id, name, phone, birth_date, gender)")
      .eq("customer_id", customerId)
    if (error) throw error
    return data ?? []
  }

  async getInverseRelationships(customerId: string) {
    const { data, error } = await this.supabase
      .from("customer_relationships")
      .select("*, related_customer:customers!customer_relationships_customer_id_fkey(id, name, phone, birth_date, gender)")
      .eq("related_customer_id", customerId)
    if (error) throw error
    return data ?? []
  }
}
