"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CarInsuranceContractForm } from "./car-insurance-contract-form"
import type { CarInsuranceEntry } from "@/app/api/renewals/car-insurance/route"

const 상태_목록 = ["상담 대기", "진행중", "보류", "완료", "취소"]

function parseUrls(raw: string | null): string[] {
  if (!raw) return []
  return raw.split("\n").map((u) => u.trim()).filter(Boolean)
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-foreground border-l-[3px] border-primary pl-2 leading-tight">
      {children}
    </h3>
  )
}

function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto p-2 bg-black/90 flex items-start justify-start">
        {isImageUrl(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="확대 보기" className="w-auto h-auto max-w-none block" />
        ) : (
          <iframe src={src} title="문서 보기" className="w-[88vw] h-[88vh] border-0" />
        )}
      </DialogContent>
    </Dialog>
  )
}

function MediaGrid({ urls, onClickImage }: { urls: string[]; onClickImage: (src: string) => void }) {
  if (urls.length === 0) return null
  return (
    <div className="space-y-3">
      {urls.map((url, i) =>
        isImageUrl(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`이미지 ${i + 1}`}
            className="w-full h-auto cursor-zoom-in rounded border block"
            onClick={() => onClickImage(url)}
          />
        ) : (
          <iframe
            key={i}
            src={url}
            title={`문서 ${i + 1}`}
            className="w-full h-[60vh] border rounded"
          />
        )
      )}
    </div>
  )
}

type Props = {
  entry: CarInsuranceEntry
  onContractSaved: () => void
}

export function CarInsuranceDetail({ entry, onContractSaved }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [contractOpen, setContractOpen] = useState(false)
  const [editState, setEditState] = useState(entry.상태 ?? "")
  const [editMemo, setEditMemo] = useState(entry.메모 ?? "")
  const [saving, setSaving] = useState(false)

  const 가입정보 = parseUrls(entry.가입정보경로)
  const 비교표 = parseUrls(entry.비교표경로)
  const 이미지 = parseUrls(entry.이미지경로)
  const hasContract = Boolean(entry.계약일)
  const stateChanged = editState !== (entry.상태 ?? "") || editMemo !== (entry.메모 ?? "")

  async function saveStatus() {
    setSaving(true)
    try {
      await fetch("/api/renewals/car-insurance/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          등록번호: entry.등록번호,
          상태: editState || null,
          메모: editMemo || null,
        }),
      })
      onContractSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t bg-muted/20 p-4 space-y-4">

      {/* 상태 & 메모 */}
      <section className="rounded-lg border bg-background p-4 space-y-3">
        <SectionTitle>상태 및 메모</SectionTitle>
        <Select value={editState} onValueChange={(v) => setEditState(v ?? "")}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            {상태_목록.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="메모를 입력하세요"
          value={editMemo}
          onChange={(e) => setEditMemo(e.target.value)}
          className="text-sm min-h-[72px] resize-none"
        />
        {stateChanged && (
          <Button size="sm" onClick={saveStatus} disabled={saving}>
            {saving ? "저장 중..." : "업데이트"}
          </Button>
        )}
      </section>

      {/* 차량정보 */}
      {entry.차량정보 && (
        <section className="rounded-lg border bg-background p-4 space-y-2">
          <SectionTitle>차량정보</SectionTitle>
          <pre className="text-sm whitespace-pre-wrap font-sans">{entry.차량정보}</pre>
        </section>
      )}

      {/* 비교내용 */}
      {entry.비교내용 && (
        <section className="rounded-lg border bg-background p-4 space-y-2">
          <SectionTitle>비교내용</SectionTitle>
          <pre className="text-sm whitespace-pre-wrap font-sans">{entry.비교내용}</pre>
        </section>
      )}

      {/* 가입정보 */}
      {가입정보.length > 0 && (
        <section className="rounded-lg border bg-background p-4 space-y-3">
          <SectionTitle>가입정보</SectionTitle>
          <MediaGrid urls={가입정보} onClickImage={setLightboxSrc} />
        </section>
      )}

      {/* 비교표 */}
      {비교표.length > 0 && (
        <section className="rounded-lg border bg-background p-4 space-y-3">
          <SectionTitle>비교표</SectionTitle>
          <MediaGrid urls={비교표} onClickImage={setLightboxSrc} />
        </section>
      )}

      {/* 가입 보험 목록 */}
      {이미지.length > 0 && (
        <section className="rounded-lg border bg-background p-4 space-y-3">
          <SectionTitle>가입 보험 목록</SectionTitle>
          <MediaGrid urls={이미지} onClickImage={setLightboxSrc} />
        </section>
      )}

      {/* 계약 완료 정보 */}
      {hasContract && (
        <section className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
          <SectionTitle>계약 완료</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {([
              ["계약일", entry.계약일],
              ["보험사", entry.보험사],
              ["채널", entry.채널],
              ["가입보험료", entry.가입보험료 != null ? `${entry.가입보험료.toLocaleString()}원` : null],
              ["차량번호", entry.차량번호],
              ["증권번호", entry.증권번호],
              ["시작일", entry.시작일],
              ["만기일", entry.만기일],
              ["피보험자", entry.피보험자],
              ["계약자", entry.계약자],
              ["설계자", entry.설계자],
            ] as [string, string | number | null][]).map(([label, value]) =>
              value != null ? (
                <div key={label}>
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* 계약 버튼 */}
      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          variant={hasContract ? "outline" : "default"}
          onClick={() => setContractOpen(true)}
        >
          {hasContract ? (
            <><Badge variant="secondary" className="mr-2 text-xs">완료</Badge>계약 수정</>
          ) : (
            "자동차보험 갱신 계약 입력"
          )}
        </Button>
      </div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <CarInsuranceContractForm
        entry={entry}
        open={contractOpen}
        onOpenChange={setContractOpen}
        onSaved={onContractSaved}
      />
    </div>
  )
}
