export type ConsultationLogAttachment = {
  id: string
  consultation_log_id: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  created_at: string
  signed_url?: string
}

export type ConsultationLog = {
  id: string
  customer_id: string
  content: string
  created_at: string
  updated_at: string
  consultation_log_attachments: ConsultationLogAttachment[]
}

export type AttachmentInsert = {
  consultation_log_id: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
}
