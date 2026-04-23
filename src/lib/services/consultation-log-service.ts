import { SupabaseClient } from "@supabase/supabase-js"
import { ConsultationLogRepository } from "@/lib/repositories/consultation-log-repository"
import type { ConsultationLog, ConsultationLogAttachment } from "@/types/consultation-log"

const BUCKET = "consultation-attachments"
const MAX_FILE_SIZE = 10 * 1024 * 1024

export class ConsultationLogService {
  private repository: ConsultationLogRepository

  constructor(private supabase: SupabaseClient) {
    this.repository = new ConsultationLogRepository(supabase)
  }

  async getLogs(customerId: string): Promise<ConsultationLog[]> {
    const logs = await this.repository.findByCustomerId(customerId)
    return this.withSignedUrls(logs)
  }

  async createLog(customerId: string, content: string, files: File[], consultationDate: string): Promise<ConsultationLog> {
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      throw new Error(`파일 크기 초과: ${oversized.name} (최대 10MB)`)
    }

    const log = await this.repository.create(customerId, content, consultationDate)

    for (const file of files) {
      const path = `${customerId}/${log.id}/${Date.now()}_${file.name}`
      const buffer = await file.arrayBuffer()

      const { error: uploadError } = await this.supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      await this.repository.createAttachment({
        consultation_log_id: log.id,
        file_name: file.name,
        file_path: path,
        file_type: file.type || null,
        file_size: file.size,
      })
    }

    const created = await this.repository.findById(log.id)
    if (!created) throw new Error("상담일지 조회 실패")
    return (await this.withSignedUrls([created]))[0]
  }

  async deleteLog(logId: string): Promise<void> {
    const attachments = await this.repository.findAttachmentsByLogId(logId)

    if (attachments.length > 0) {
      const paths = attachments.map((a) => a.file_path)
      await this.supabase.storage.from(BUCKET).remove(paths)
    }

    await this.repository.delete(logId)
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600)

    if (error) throw error
    return data.signedUrl
  }

  private async withSignedUrls(logs: ConsultationLog[]): Promise<ConsultationLog[]> {
    return Promise.all(
      logs.map(async (log) => ({
        ...log,
        consultation_log_attachments: await this.signAttachments(
          log.consultation_log_attachments
        ),
      }))
    )
  }

  private async signAttachments(
    attachments: ConsultationLogAttachment[]
  ): Promise<ConsultationLogAttachment[]> {
    return Promise.all(
      attachments.map(async (att) => {
        const { data } = await this.supabase.storage
          .from(BUCKET)
          .createSignedUrl(att.file_path, 3600)
        return { ...att, signed_url: data?.signedUrl ?? "" }
      })
    )
  }
}
