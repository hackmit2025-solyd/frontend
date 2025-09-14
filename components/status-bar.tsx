import { Badge } from "@/components/ui/badge"
import { Wifi } from "lucide-react"

export function StatusBar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-6 py-3 pb-[env(safe-area-inset-bottom)] z-[60]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">Connected</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Last sync: 2 min ago
          </Badge>
        </div>
      </div>
    </footer>
  )
}
