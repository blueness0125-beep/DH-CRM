"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Users, UserPlus, X } from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

const FAMILY_RELATIONSHIP_TYPES = ["배우자", "자녀", "부모", "형제", "친척"]

// 역방향 관계 표시용 (A가 B의 자녀면, B는 A의 부모)
const INVERSE_TYPE: Record<string, string> = {
  자녀: "부모",
  부모: "자녀",
  배우자: "배우자",
  형제: "형제",
  친척: "친척",
}

type RelationshipRecord = {
  id: string
  customer_id: string
  related_customer_id: string
  relationship_type: string
}

type FamilyGroupSectionProps = {
  customer: Customer
  familyMembers: Customer[]
}

export function FamilyGroupSection({ customer, familyMembers }: FamilyGroupSectionProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null)
  const [selectedType, setSelectedType] = useState("")
  const [relationshipMap, setRelationshipMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    fetchRelationshipTypes()
  }, [customer.id, familyMembers])

  async function fetchRelationshipTypes() {
    try {
      const res = await fetch(`/api/customers/${customer.id}/relationships`)
      if (!res.ok) return
      const json = await res.json()
      const map = new Map<string, string>()

      for (const r of (json.data.direct ?? []) as RelationshipRecord[]) {
        map.set(r.related_customer_id, r.relationship_type)
      }
      for (const r of (json.data.inverse ?? []) as RelationshipRecord[]) {
        const displayType = INVERSE_TYPE[r.relationship_type] ?? r.relationship_type
        map.set(r.customer_id, displayType)
      }
      setRelationshipMap(map)
    } catch {
      // ignore
    }
  }

  async function handleAddMember(selected: Customer) {
    setSelectedMember(selected)
    setTypeDialogOpen(true)
  }

  async function confirmAddMember() {
    if (!selectedMember || !selectedType) return
    try {
      if (customer.family_group_id) {
        const res = await fetch(`/api/family-groups/${customer.family_group_id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: selectedMember.id }),
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch("/api/family-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${customer.name} 가족`,
            member_ids: [customer.id, selectedMember.id],
            primary_id: customer.id,
          }),
        })
        if (!res.ok) throw new Error()
      }

      await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          related_customer_id: selectedMember.id,
          relationship_type: selectedType,
        }),
      })

      toast.success(`${selectedMember.name}님을 가족으로 추가했습니다`)
      setTypeDialogOpen(false)
      setSelectedMember(null)
      setSelectedType("")
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.name}
                        {member.is_primary && (
                          <Badge variant="secondary" className="ml-2 text-xs">주 고객</Badge>
                        )}
                      </p>
                      {relationshipMap.has(member.id) && (
                        <Badge variant="outline" className="text-xs">
                          {relationshipMap.get(member.id)}
                        </Badge>
                      )}
                    </div>
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

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>가족 관계 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMember && (
              <p className="text-sm">
                <span className="font-medium">{selectedMember.name}</span>님은 나의
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {FAMILY_RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    selectedType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTypeDialogOpen(false)
                setSelectedMember(null)
                setSelectedType("")
              }}
            >
              취소
            </Button>
            <Button onClick={confirmAddMember} disabled={!selectedType}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
