"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CarInsuranceContractForm } from "./car-insurance-contract-form"
import type { CarInsuranceEntry } from "@/app/api/renewals/car-insurance/route"
import type { CarInsuranceContract } from "@/types/car-insurance"
import { Plus, Pencil, Trash2 } from "lucide-react"

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
    <div
      className="fixed inset-0 z-50 bg-black/90 overflow-auto flex items-start justify-start p-4"
      onClick={onClose}
    >
      <button
        className="fixed top-4 right-4 text-white bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none z-10"
        onClick={onClose}
      >
        ✕
      </button>
      {isImageUrl(src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="확대 보기"
          className="block h-auto max-w-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <iframe
          src={src}
          title="문서 보기"
          className="w-[88vw] h-[88vh] border-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
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
            className="max-w-full h-auto cursor-zoom-in rounded border block"
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

function ContractCard({
  contract,
  index,
  onEdit,
  onDelete,
}: {
  contract: CarInsuranceContract
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("이 계약을 삭제할까요?")) return
    setDeleting(true)
    try {
      await fetch(`/api/renewals/car-insurance/contract/${contract.id}`, { method: "DELETE" })
      onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-green-700">
          계약 {index + 1}{contract.차량번호 ? ` · ${contract.차량번호}` : ""}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />수정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-3 w-3 mr-1" />{deleting ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {([
          ["계약일", contract.계약일],
          ["보험사", contract.보험사],
          ["채널", contract.채널],
          ["가입보험료", contract.가입보험료 != null ? `${contract.가입보험료.toLocaleString()}원` : null],
          ["증권번호", contract.증권번호],
          ["시작일", contract.시작일],
          ["만기일", contract.만기일],
          ["피보험자", contract.피보험자],
          ["계약자", contract.계약자],
          ["설계자", contract.설계자],
        ] as [string, string | number | null][]).map(([label, value]) =>
          value != null ? (
            <div key={label}>
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-medium">{value}</span>
            </div>
          ) : null
        )}
      </div>
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
  const [editingContract, setEditingContract] = useState<CarInsuranceContract | null>(null)
  const [editState, setEditState] = useState(entry.상태 ?? "")
  const [editMemo, setEditMemo] = useState(entry.메모 ?? "")
  const [saving, setSaving] = useState(false)

  const 가입정보 = parseUrls(entry.가입정보경로)
  const 비교표 = parseUrls(entry.비교표경로)
  const 이미지 = parseUrls(entry.이미지경로)
  const contracts = entry.car_insurance_contracts ?? []
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

  function openAdd() {
    setEditingContract(null)
    setContractOpen(true)
  }

  function openEdit(contract: CarInsuranceContract) {
    setEditingContract(contract)
    setContractOpen(true)
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

      {/* 계약 목록 */}
      {contracts.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>계약 완료 ({contracts.length}건)</SectionTitle>
          {contracts.map((c, i) => (
            <ContractCard
              key={c.id}
              contract={c}
              index={i}
              onEdit={() => openEdit(c)}
              onDelete={onContractSaved}
            />
          ))}
        </section>
      )}

      {/* 계약 추가 버튼 */}
      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {contracts.length === 0 ? "계약 입력" : "계약 추가"}
        </Button>
      </div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <CarInsuranceContractForm
        entry={entry}
        contract={editingContract}
        open={contractOpen}
        onOpenChange={setContractOpen}
        onSaved={onContractSaved}
      />
    </div>
  )
}
