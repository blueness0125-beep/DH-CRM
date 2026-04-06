import { SupabaseClient } from "@supabase/supabase-js"
import { FamilyRepository } from "@/lib/repositories/family-repository"
import type { FamilyGroupCreate, RelationshipCreate } from "@/lib/validators/relationship-schema"

export class FamilyService {
  private repository: FamilyRepository

  constructor(supabase: SupabaseClient) {
    this.repository = new FamilyRepository(supabase)
  }

  async createFamilyGroup(data: FamilyGroupCreate) {
    const group = await this.repository.createGroup(data.name)

    for (const memberId of data.member_ids) {
      const isPrimary = memberId === data.primary_id
      await this.repository.addMemberToGroup(memberId, group.id, isPrimary)
    }

    return group
  }

  async addFamilyMember(groupId: string, customerId: string) {
    await this.repository.addMemberToGroup(customerId, groupId)
  }

  async removeFamilyMember(customerId: string, groupId: string) {
    await this.repository.removeMemberFromGroup(customerId)

    // Check if group still has members
    const remaining = await this.repository.getGroupMembers(groupId)
    if (remaining.length === 0) {
      await this.repository.deleteGroup(groupId)
    }
  }

  async getFamilyMembers(groupId: string) {
    return this.repository.getGroupMembers(groupId)
  }

  async createRelationship(data: RelationshipCreate) {
    return this.repository.createRelationship(
      data.customer_id,
      data.related_customer_id,
      data.relationship_type,
      data.note
    )
  }

  async deleteRelationship(id: string) {
    return this.repository.deleteRelationship(id)
  }

  async getRelationships(customerId: string) {
    const [direct, inverse] = await Promise.all([
      this.repository.getRelationships(customerId),
      this.repository.getInverseRelationships(customerId),
    ])
    return { direct, inverse }
  }
}
