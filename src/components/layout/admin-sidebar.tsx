"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Car, Settings } from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/customers", label: "고객 관리", icon: Users },
  { href: "/admin/renewals", label: "갱신 관리", icon: Car },
  { href: "/admin/settings", label: "설정", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="text-lg font-bold text-primary">
          동행지사
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
