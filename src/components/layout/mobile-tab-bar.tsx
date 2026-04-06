"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, UserPlus, Car } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/customers", label: "고객", icon: Users },
  { href: "/admin/customers/new", label: "등록", icon: UserPlus, highlight: true },
  { href: "/admin/renewals", label: "갱신", icon: Car },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-card md:hidden">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/admin/customers/new" && pathname.startsWith(tab.href + "/"))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              tab.highlight
                ? isActive
                  ? "text-primary"
                  : "text-muted-foreground"
                : isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.highlight ? (
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                isActive ? "bg-primary" : "bg-primary"
              )}>
                <tab.icon className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : (
              <tab.icon className="h-5 w-5" />
            )}
            <span className={tab.highlight ? "sr-only" : ""}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
