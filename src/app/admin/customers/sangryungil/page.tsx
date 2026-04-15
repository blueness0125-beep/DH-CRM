"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Phone, CalendarDays } from "lucide-react"
import { formatPhone, formatDate, calculateAge } from "@/lib/utils/format"
import type { Customer } from "@/types/customer"
import { toast } from "sonner"

export default function SangryungilPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/customers/sangryungil")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login")
          return
        }
        const json = await res.json()
        if (res.ok) {
          setCustomers(json.data ?? [])
        } else {
          toast.error("데이터를 불러오지 못했습니다")
        }
      })
      .catch((err) => {
        console.error(err)
        toast.error("데이터를 불러오지 못했습니다")
      })
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-pink-600" />
            이번 달 상령일 고객
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            생일 기준 60일 후가 이번 달에 해당하는 고객 목록입니다.
          </p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{customers.length}</span>명
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">이름</TableHead>
              <TableHead className="w-28">생년월일</TableHead>
              <TableHead className="w-16">나이</TableHead>
              <TableHead className="w-16">성별</TableHead>
              <TableHead className="w-36">전화번호</TableHead>
              <TableHead>주소</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-12">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  이번 달 상령일 고객이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{formatDate(customer.birth_date)}</TableCell>
                  <TableCell>{calculateAge(customer.birth_date) ?? "-"}</TableCell>
                  <TableCell>
                    {customer.gender && (
                      <Badge variant={customer.gender === "M" ? "default" : "secondary"}>
                        {customer.gender === "M" ? "남" : "여"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       {formatPhone(customer.phone)}
                       {customer.phone && (
                         <a href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-700">
                           <Phone className="h-3.5 w-3.5" />
                         </a>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {customer.home_address ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            이번 달 상령일 고객이 없습니다
          </div>
        ) : (
          customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/admin/customers/${customer.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(customer.birth_date)}
                    {calculateAge(customer.birth_date) != null && ` (${calculateAge(customer.birth_date)}세)`}
                  </p>
                  {customer.phone && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(customer.phone)}
                    </p>
                  )}
                </div>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    전화
                  </a>
                )}
              </div>
              {customer.home_address && (
                <p className="mt-2 truncate text-sm text-muted-foreground border-t pt-2">{customer.home_address}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
