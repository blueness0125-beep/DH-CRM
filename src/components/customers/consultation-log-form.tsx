"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileImage, FileText, Upload, X } from "lucide-react"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

type SelectedFile = { file: File; id: string }

type Props = {
  customerId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function FileItem({ item, onRemove }: { item: SelectedFile; onRemove: () => void }) {
  const isImage = item.file.type.startsWith("image/")
  const Icon = isImage ? FileImage : FileText

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {(item.file.size / 1024).toFixed(0)}KB
      </span>
      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function ConsultationLogForm({ customerId, isOpen, onClose, onSuccess }: Props) {
  const [consultationDate, setConsultationDate] = useState(todayStr)
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setConsultationDate(todayStr())
    setContent("")
    setFiles([])
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ""
    setError(null)

    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`파일 크기 초과: ${oversized.name} (최대 10MB)`)
      return
    }

    setFiles((prev) => {
      const next = [...prev, ...selected.map((file) => ({ file, id: `${Date.now()}_${Math.random()}` }))]
      if (next.length > MAX_FILES) {
        setError(`파일은 최대 ${MAX_FILES}개까지 첨부 가능합니다.`)
        return prev
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError("내용을 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("customerId", customerId)
      formData.append("content", content.trim())
      formData.append("consultationDate", consultationDate)
      files.forEach(({ file }) => formData.append("files", file))

      const res = await fetch("/api/consultation-logs", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "저장 실패")
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>상담일지 작성</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="consultationDate">상담 날짜</Label>
            <Input
              id="consultationDate"
              type="date"
              value={consultationDate}
              onChange={(e) => setConsultationDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">상담 내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상담 내용을 입력하세요..."
              className="min-h-[200px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>첨부파일 (최대 {MAX_FILES}개, 파일당 10MB)</Label>
            <div className="space-y-1.5">
              {files.map((item) => (
                <FileItem
                  key={item.id}
                  item={item}
                  onRemove={() => setFiles((prev) => prev.filter((f) => f.id !== item.id))}
                />
              ))}
            </div>
            {files.length < MAX_FILES && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.hwp"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  파일 선택
                </Button>
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
