import { SupabaseClient } from "@supabase/supabase-js"
import type { ConsultationLog, AttachmentInsert } from "@/types/consultation-log"

export class ConsultationLogRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByCustomerId(customerId: string): Promise<ConsultationLog[]> {
    const { data, error } = await this.supabase
      .from("consultation_logs")
      .select("*, consultation_log_attachments(*)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async findById(id: string): Promise<ConsultationLog | null> {
    const { data, error } = await this.supabase
      .from("consultation_logs")
      .select("*, consultation_log_attachments(*)")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  async create(customerId: string, content: string): Promise<ConsultationLog> {
    const { data, error } = await this.supabase
      .from("consultation_logs")
      .insert({ customer_id: customerId, content })
      .select("*, consultation_log_attachments(*)")
      .single()

    if (error) throw error
    return data
  }

  async createAttachment(attachment: AttachmentInsert): Promise<void> {
    const { error } = await this.supabase
      .from("consultation_log_attachments")
      .insert(attachment)

    if (error) throw error
  }

  async findAttachmentsByLogId(logId: string) {
    const { data, error } = await this.supabase
      .from("consultation_log_attachments")
      .select("*")
      .eq("consultation_log_id", logId)

    if (error) throw error
    return data ?? []
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("consultation_logs")
      .delete()
      .eq("id", id)

    if (error) throw error
  }
}
