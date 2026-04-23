"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BookOpen, FileImage, FileText, Trash2 } from "lucide-react"
import type { ConsultationLog, ConsultationLogAttachment } from "@/types/consultation-log"

type Props = {
  customerId: string
  refreshKey: number
}

function AttachmentChip({ att }: { att: ConsultationLogAttachment }) {
  const isImage = att.file_type?.startsWith("image/")
  const Icon = isImage ? FileImage : FileText

  return (
    <a
      href={att.signed_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted"
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="max-w-[200px] truncate">{att.file_name}</span>
    </a>
  )
}

function LogItem({
  log,
  onDelete,
  isDeleting,
}: {
  log: ConsultationLog
  onDelete: () => void
  isDeleting: boolean
}) {
  const dateStr = new Date(log.created_at).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {log.consultation_date ? log.consultation_date.replace(/-/g, ".") : dateStr}
        </span>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <button
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                disabled={isDeleting}
              />
            }
          >
            <Trash2 className="h-3 w-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>상담일지 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 상담일지를 삭제하면 첨부파일도 함께 삭제됩니다. 계속하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="whitespace-pre-wrap text-sm">{log.content}</p>

      {log.consultation_log_attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {log.consultation_log_attachments.map((att) => (
            <AttachmentChip key={att.id} att={att} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ConsultationLogSection({ customerId, refreshKey }: Props) {
  const [logs, setLogs] = useState<ConsultationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/consultation-logs?customerId=${customerId}`)
      if (!res.ok) throw new Error("조회 실패")
      setLogs(await res.json())
    } catch {
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, refreshKey])

  async function handleDelete(logId: string) {
    setDeletingId(logId)
    try {
      const res = await fetch(`/api/consultation-logs/${logId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("삭제 실패")
      setLogs((prev) => prev.filter((l) => l.id !== logId))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          상담일지
          {logs.length > 0 && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">({logs.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 상담일지가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={log.id}>
                {index > 0 && <Separator className="mb-4" />}
                <LogItem
                  log={log}
                  onDelete={() => handleDelete(log.id)}
                  isDeleting={deletingId === log.id}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
