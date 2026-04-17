"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CarInsuranceEntry } from "@/app/api/renewals/car-insurance/route"

const 보험사_목록 = ["삼성화재", "KB손해보험", "DB손해보험", "현대해상"]
const 채널_목록 = ["씨엠", "다이렉트", "TM라인", "오프라인"]
const 설계자_목록 = ["송상훈", "이중경"]

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function addOneYear(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split("T")[0]
}

type Props = {
  entry: CarInsuranceEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function CarInsuranceContractForm({ entry, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState({
    계약일: todayStr(),
    보험사: "삼성화재",
    채널: "씨엠",
    가입보험료: "",
    차량번호: "",
    증권번호: "",
    시작일: "",
    만기일: "",
    피보험자: "",
    계약자: "",
    설계자: "송상훈",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    setForm({
      계약일: entry.계약일 ?? todayStr(),
      보험사: entry.보험사 ?? "삼성화재",
      채널: entry.채널 ?? "씨엠",
      가입보험료: entry.가입보험료 != null ? String(entry.가입보험료) : "",
      차량번호: entry.차량번호 ?? "",
      증권번호: entry.증권번호 ?? "",
      시작일: entry.시작일 ?? "",
      만기일: entry.만기일 ?? "",
      피보험자: entry.피보험자 ?? "",
      계약자: entry.계약자 ?? entry.고객명 ?? "",
      설계자: entry.설계자 ?? "송상훈",
    })
    setError(null)
  }, [entry])

  function set(field: string, value: string | null) {
    const val = value ?? ""
    setForm((prev) => {
      const next = { ...prev, [field]: val }
      if (field === "시작일") next.만기일 = addOneYear(val)
      return next
    })
  }

  async function handleSubmit() {
    if (!entry) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/renewals/car-insurance/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          등록번호: entry.등록번호,
          계약일: form.계약일,
          보험사: form.보험사,
          채널: form.채널,
          가입보험료: form.가입보험료 ? parseInt(form.가입보험료) : null,
          차량번호: form.차량번호 || null,
          증권번호: form.증권번호 || null,
          시작일: form.시작일 || null,
          만기일: form.만기일 || null,
          피보험자: form.피보험자 || null,
          계약자: form.계약자 || null,
          설계자: form.설계자 || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? "저장 실패")
      }
      onSaved()
      onOpenChange(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>자동차보험 계약 체결</SheetTitle>
          {entry && (
            <p className="text-sm text-muted-foreground">{entry.고객명} · 갱신일 {entry.갱신일}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Field label="계약일">
            <Input type="date" value={form.계약일} onChange={(e) => set("계약일", e.target.value)} />
          </Field>

          <Field label="보험사">
            <Select value={form.보험사} onValueChange={(v) => set("보험사", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {보험사_목록.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="채널">
            <Select value={form.채널} onValueChange={(v) => set("채널", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {채널_목록.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="가입보험료 (원)">
            <Input
              type="number"
              placeholder="0"
              value={form.가입보험료}
              onChange={(e) => set("가입보험료", e.target.value)}
            />
          </Field>

          <Field label="차량번호">
            <Input placeholder="예) 12가3456" value={form.차량번호} onChange={(e) => set("차량번호", e.target.value)} />
          </Field>

          <Field label="증권번호">
            <Input value={form.증권번호} onChange={(e) => set("증권번호", e.target.value)} />
          </Field>

          <Field label="시작일">
            <Input type="date" value={form.시작일} onChange={(e) => set("시작일", e.target.value)} />
          </Field>

          <Field label="만기일">
            <Input type="date" value={form.만기일} onChange={(e) => set("만기일", e.target.value)} />
          </Field>

          <Field label="피보험자">
            <Input value={form.피보험자} onChange={(e) => set("피보험자", e.target.value)} />
          </Field>

          <Field label="계약자">
            <Input value={form.계약자} onChange={(e) => set("계약자", e.target.value)} />
          </Field>

          <Field label="설계자">
            <Select value={form.설계자} onValueChange={(v) => set("설계자", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {설계자_목록.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}
