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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Link2, Plus, X } from "lucide-react"
import { CustomerSearchDialog } from "@/components/shared/customer-search-dialog"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

const FAMILY_RELATIONSHIP_TYPES = new Set(["배우자", "자녀", "부모", "형제", "친척"])

const RELATIONSHIP_TYPES = ["지인", "소개인", "동료", "기타"]

type RelationshipItem = {
  id: string
  relationship_type: string
  note: string | null
  related_customer: {
    id: string
    name: string
    phone: string | null
    birth_date: string | null
    gender: string | null
  }
}

type RelatedPersonsSectionProps = {
  customerId: string
}

export function RelatedPersonsSection({ customerId }: RelatedPersonsSectionProps) {
  const router = useRouter()
  const [relationships, setRelationships] = useState<RelationshipItem[]>([])
  const [inverseRelationships, setInverseRelationships] = useState<RelationshipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedType, setSelectedType] = useState("")

  useEffect(() => {
    fetchRelationships()
  }, [customerId])

  async function fetchRelationships() {
    try {
      const res = await fetch(`/api/customers/${customerId}/relationships`)
      if (res.ok) {
        const json = await res.json()
        setRelationships(json.data.direct ?? [])
        setInverseRelationships(json.data.inverse ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomer(customer)
    setTypeDialogOpen(true)
  }

  async function handleCreateRelationship() {
    if (!selectedCustomer || !selectedType) return
    try {
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          related_customer_id: selectedCustomer.id,
          relationship_type: selectedType,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${selectedCustomer.name}님을 관계인으로 추가했습니다`)
      setTypeDialogOpen(false)
      setSelectedCustomer(null)
      setSelectedType("")
      fetchRelationships()
    } catch {
      toast.error("관계인 추가에 실패했습니다")
    }
  }

  async function handleDeleteRelationship(relId: string, name: string) {
    try {
      const res = await fetch(`/api/relationships/${relId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(`${name}님과의 관계를 삭제했습니다`)
      fetchRelationships()
    } catch {
      toast.error("관계 삭제에 실패했습니다")
    }
  }

  const allRelationships = [
    ...relationships.map((r) => ({ ...r, direction: "direct" as const })),
    ...inverseRelationships.map((r) => ({ ...r, direction: "inverse" as const })),
  ].filter((r) => !FAMILY_RELATIONSHIP_TYPES.has(r.relationship_type))

  const excludeIds = [customerId, ...allRelationships.map((r) => r.related_customer.id)]

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            관계인
            {allRelationships.length > 0 && (
              <Badge variant="secondary" className="text-xs">{allRelationships.length}</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            관계인 추가
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : allRelationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 관계인이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {allRelationships.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <Link
                    href={`/admin/customers/${rel.related_customer.id}`}
                    className="flex-1 hover:underline"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rel.related_customer.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {rel.relationship_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(rel.related_customer.birth_date)}
                      {rel.related_customer.phone && ` · ${formatPhone(rel.related_customer.phone)}`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1">
                    {rel.related_customer.phone && (
                      <a
                        href={`tel:${rel.related_customer.phone}`}
                        className="rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 md:hidden"
                      >
                        전화
                      </a>
                    )}
                    {rel.direction === "direct" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteRelationship(rel.id, rel.related_customer.name)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
        onSelect={handleCustomerSelect}
        excludeIds={excludeIds}
        title="관계인 검색"
      />

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>관계 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCustomer && (
              <p className="text-sm">
                <span className="font-medium">{selectedCustomer.name}</span>님과의 관계를 선택해주세요
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {RELATIONSHIP_TYPES.map((type) => (
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
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateRelationship} disabled={!selectedType}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
