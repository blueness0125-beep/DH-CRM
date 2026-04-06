"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Briefcase } from "lucide-react"
import { occupations, type Occupation } from "@/lib/data/occupations"

type OccupationSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (occupation: Occupation) => void
}

export function OccupationSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: OccupationSearchDialogProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return occupations
    const q = query.toLowerCase()
    return occupations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q)
    )
  }, [query])

  const groupedResults = useMemo(() => {
    const groups: Record<string, Occupation[]> = {}
    for (const occ of filtered) {
      if (!groups[occ.category]) {
        groups[occ.category] = []
      }
      groups[occ.category] = [...(groups[occ.category] ?? []), occ]
    }
    return groups
  }, [filtered])

  function handleSelect(occupation: Occupation) {
    onSelect(occupation)
    onOpenChange(false)
    setQuery("")
  }

  const riskGradeVariant = (grade: string) => {
    if (grade === "1급") return "default" as const
    if (grade === "2급") return "secondary" as const
    return "destructive" as const
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            직업 검색
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="직업명 또는 분류 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {Object.entries(groupedResults).map(([category, occs]) => (
              <div key={category}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {occs.map((occ) => (
                    <button
                      key={`${occ.category}-${occ.name}`}
                      type="button"
                      onClick={() => handleSelect(occ)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span>{occ.name}</span>
                      <Badge variant={riskGradeVariant(occ.riskGrade)}>
                        {occ.riskGrade}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
