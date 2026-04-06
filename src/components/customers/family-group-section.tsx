"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, X, UserPlus } from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

type FamilyGroupSectionProps = {
  customer: Customer
  familyMembers: Customer[]
}

export function FamilyGroupSection({ customer, familyMembers }: FamilyGroupSectionProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)

  async function handleAddMember(selected: Customer) {
    try {
      if (customer.family_group_id) {
        const res = await fetch(`/api/family-groups/${customer.family_group_id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: selected.id }),
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch("/api/family-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${customer.name} 가족`,
            member_ids: [customer.id, selected.id],
            primary_id: customer.id,
          }),
        })
        if (!res.ok) throw new Error()
      }
      toast.success(`${selected.name}님을 가족으로 추가했습니다`)
      router.refresh()
    } catch {
      toast.error("가족 추가에 실패했습니다")
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!customer.family_group_id) return
    try {
      const res = await fetch(`/api/family-groups/${customer.family_group_id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: memberId }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${memberName}님을 가족에서 제거했습니다`)
      router.refresh()
    } catch {
      toast.error("가족 제거에 실패했습니다")
    }
  }

  const otherMembers = familyMembers.filter((m) => m.id !== customer.id)
  const excludeIds = familyMembers.map((m) => m.id)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            가족 구성원
            {otherMembers.length > 0 && (
              <Badge variant="secondary" className="text-xs">{otherMembers.length}</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            가족 추가
          </Button>
        </CardHeader>
        <CardContent>
          {otherMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 가족이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {otherMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <Link
                    href={`/admin/customers/${member.id}`}
                    className="flex-1 hover:underline"
                  >
                    <p className="font-medium">
                      {member.name}
                      {member.is_primary && (
                        <Badge variant="secondary" className="ml-2 text-xs">주 고객</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(member.birth_date)}
                      {calculateAge(member.birth_date) != null && ` (${calculateAge(member.birth_date)}세)`}
                      {member.phone && ` · ${formatPhone(member.phone)}`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 md:hidden"
                      >
                        전화
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={handleAddMember}
        excludeIds={excludeIds}
        title="가족 추가"
      />
    </>
  )
}
