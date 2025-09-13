import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Activity, X } from "lucide-react"

export function ActionFilters() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Active Filters</h3>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Action Type Filter */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Action Type
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Voice Queries", count: 12, active: true },
                  { label: "Database Queries", count: 8, active: false },
                  { label: "Appointments", count: 5, active: false },
                  { label: "Messages", count: 3, active: false },
                  { label: "Verifications", count: 2, active: false },
                ].map((filter) => (
                  <div key={filter.label} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked={filter.active} className="rounded border-border" />
                      <span>{filter.label}</span>
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {filter.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* User Filter */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                User
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Dr. Smith", count: 15, active: false },
                  { label: "Dr. Johnson", count: 8, active: false },
                  { label: "Dr. Williams", count: 6, active: false },
                  { label: "System", count: 4, active: false },
                ].map((filter) => (
                  <div key={filter.label} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked={filter.active} className="rounded border-border" />
                      <span>{filter.label}</span>
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {filter.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Range Filter */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Range
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Last Hour", active: false },
                  { label: "Today", active: true },
                  { label: "This Week", active: false },
                  { label: "This Month", active: false },
                  { label: "Custom Range", active: false },
                ].map((filter) => (
                  <label key={filter.label} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="timeRange"
                      defaultChecked={filter.active}
                      className="rounded-full border-border"
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
