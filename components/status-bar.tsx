import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertTriangle, Wifi } from "lucide-react"

export function StatusBar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-6 py-3 pb-[env(safe-area-inset-bottom)] z-[60]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Connected</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Processing query...</span>
            <Progress value={75} className="w-20 h-2" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">3 tasks completed</span>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">2 alerts pending</span>
          </div>

          <Badge variant="secondary" className="text-xs">
            Last sync: 2 min ago
          </Badge>
        </div>
      </div>
    </footer>
  )
}
