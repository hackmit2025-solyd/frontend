"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, History, Upload, Settings, Moon, Sun, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useHipaa } from "@/components/hipaa-provider"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: Activity,
  },
  {
    name: "Uploads",
    href: "/uploads",
    icon: Upload,
  },
  {
    name: "Actions History",
    href: "/actions",
    icon: History,
  },
]

export function TopNavBar() {
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()
  const { hipaaEnabled, setHipaaEnabled } = useHipaa()

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-balance">Healthcare Agent Dashboard</h1>
          </div>
          
          {/* Navigation + Integrated Theme */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2",
                      isActive && (
                        resolvedTheme === "dark"
                          ? "bg-muted font-medium"
                          : "bg-primary/10 text-primary border border-primary/20 font-medium hover:bg-primary/15"
                      )
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}

            {/* Divider */}
            <Separator orientation="vertical" className="mx-2 h-6" />

            {/* Theme Toggle */}
            <div className="flex items-center gap-2 px-2">
              <Sun
                className={cn(
                  "h-4 w-4",
                  resolvedTheme === "dark" ? "text-muted-foreground" : "text-foreground"
                )}
              />
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
              <Moon
                className={cn(
                  "h-4 w-4",
                  resolvedTheme === "dark" ? "text-foreground" : "text-muted-foreground"
                )}
              />
            </div>

            {/* Divider */}
            <Separator orientation="vertical" className="mx-2 h-6" />

            {/* HIPAA Mode Toggle */}
            <div className="flex items-center gap-2 px-2">
              <Shield className={cn("h-4 w-4", hipaaEnabled ? "text-foreground" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">HIPAA</span>
              <Switch
                checked={hipaaEnabled}
                onCheckedChange={(checked) => setHipaaEnabled(!!checked)}
                aria-label="Toggle HIPAA mode"
              />
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
