"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function SettingsClient() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error("새 비밀번호는 6자 이상이어야 합니다")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다")
      return
    }

    setSaving(true)
    try {
      // 현재 비밀번호로 재인증
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("로그인 정보를 확인할 수 없습니다")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) {
        toast.error("현재 비밀번호가 올바르지 않습니다")
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success("비밀번호가 변경되었습니다")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("비밀번호 변경에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">설정</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6자 이상"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />변경 중...</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" />비밀번호 변경</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
