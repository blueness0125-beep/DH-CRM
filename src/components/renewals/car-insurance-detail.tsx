"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CarInsuranceContractForm } from "./car-insurance-contract-form"
import type { CarInsuranceEntry } from "@/app/api/renewals/car-insurance/route"

function parseUrls(raw: string | null): string[] {
  if (!raw) return []
  return raw.split("\n").map((u) => u.trim()).filter(Boolean)
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url)
}

type LightboxProps = {
  src: string | null
  onClose: () => void
}

function Lightbox({ src, onClose }: LightboxProps) {
  if (!src) return null
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 flex items-center justify-center bg-black/90">
        {isImageUrl(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="확대 보기" className="max-w-full max-h-[90vh] object-contain" />
        ) : (
          <iframe src={src} title="문서 보기" className="w-[90vw] h-[90vh] border-0" />
        )}
      </DialogContent>
    </Dialog>
  )
}

type MediaGridProps = {
  urls: string[]
  onClickImage: (src: string) => void
}

function MediaGrid({ urls, onClickImage }: MediaGridProps) {
  if (urls.length === 0) return null
  return (
    <div className="space-y-2">
      {urls.map((url, i) =>
        isImageUrl(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`이미지 ${i + 1}`}
            className="max-w-full max-h-[70vh] object-contain cursor-zoom-in rounded border"
            onClick={() => onClickImage(url)}
          />
        ) : (
          <iframe
            key={i}
            src={url}
            title={`문서 ${i + 1}`}
            className="w-full h-[60vh] border rounded cursor-pointer"
            onClick={() => onClickImage(url)}
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

  const 가입정보 = parseUrls(entry.가입정보경로)
  const 비교표 = parseUrls(entry.비교표경로)
  const 이미지 = parseUrls(entry.이미지경로)

  const hasContract = Boolean(entry.계약일)

  return (
    <div className="border-t bg-muted/20 p-4 space-y-5">
      {/* 차량정보 */}
      {entry.차량정보 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">차량정보</p>
          <pre className="text-sm whitespace-pre-wrap font-sans">{entry.차량정보}</pre>
        </div>
      )}

      {/* 비교내용 */}
      {entry.비교내용 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">비교내용</p>
          <pre className="text-sm whitespace-pre-wrap font-sans">{entry.비교내용}</pre>
        </div>
      )}

      {/* 가입정보 이미지 */}
      {가입정보.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">가입정보</p>
          <MediaGrid urls={가입정보} onClickImage={setLightboxSrc} />
        </div>
      )}

      {/* 비교표 */}
      {비교표.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">비교표</p>
          <MediaGrid urls={비교표} onClickImage={setLightboxSrc} />
        </div>
      )}

      {/* 기타 이미지 */}
      {이미지.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">이미지</p>
          <MediaGrid urls={이미지} onClickImage={setLightboxSrc} />
        </div>
      )}

      {/* 기존 계약 정보 표시 */}
      {hasContract && (
        <div className="rounded-lg border bg-green-50 p-3 space-y-1">
          <p className="text-xs font-semibold text-green-700 mb-2">계약 완료</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {[
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
            ].map(([label, value]) =>
              value ? (
                <div key={label as string}>
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* 계약 버튼 */}
      <div className="flex justify-end pt-2 border-t">
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
