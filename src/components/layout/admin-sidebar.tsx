"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Car, Settings, RefreshCw } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon?: React.ElementType
  children?: { href: string; label: string }[]
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/customers", label: "고객 관리", icon: Users },
  {
    href: "/admin/renewals",
    label: "갱신 관리",
    icon: RefreshCw,
    children: [
      { href: "/admin/renewals", label: "일반 갱신" },
      { href: "/admin/renewals/car-insurance", label: "자동차보험 갱신" },
    ],
  },
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
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          if (item.children) {
            const isGroupActive = pathname.startsWith(item.href)
            return (
              <div key={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isGroupActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </div>
                <div className="ml-4 space-y-0.5 border-l pl-3 mt-0.5">
                  {item.children.map((child) => {
                    const isActive =
                      child.href === "/admin/renewals"
                        ? pathname === "/admin/renewals"
                        : pathname.startsWith(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Car className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
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
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
