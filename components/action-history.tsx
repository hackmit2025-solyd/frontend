"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  User,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Mic,
  Database,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { useEffect, useState } from "react"

interface ActionHistoryProps {
  searchQuery: string
}

const mockActions: any[] = []

type ActionDoc = {
  _id: string
  type: string
  title?: string
  summary: string
  doctor: string
  timestamp?: string
  status?: string
  durationMs?: number
  resultSummary?: string
  details?: Record<string, any>
}

type UiAction = {
  id: string | number
  type: string
  title: string
  description: string
  user: string
  timestamp: string
  status: string
  duration?: string
  results?: string
  icon: any
  details: Record<string, any>
}

const iconByType: Record<string, any> = {
  voice_query: Mic,
  voice_command: Mic,
  appointment_booking: Calendar,
  database_query: Database,
  patient_lookup: Eye,
  coverage_verification: AlertTriangle,
  search: Database,
}

function toUi(doc: ActionDoc): UiAction {
  const icon = iconByType[doc.type] || Database
  const title = doc.title && doc.title.trim().length > 0 ? doc.title : `${doc.type} action`
  const ts = doc.timestamp ? new Date(doc.timestamp) : new Date()
  const duration = typeof doc.durationMs === "number" ? `${(doc.durationMs / 1000).toFixed(1)}s` : undefined
  return {
    id: doc._id,
    type: doc.type,
    title,
    description: doc.summary,
    user: doc.doctor || "Anonymous",
    timestamp: ts.toLocaleString(),
    status: doc.status || "completed",
    duration,
    results: doc.resultSummary,
    icon,
    details: doc.details || {},
  }
}

export function ActionHistory({ searchQuery }: ActionHistoryProps) {
  const [expandedAction, setExpandedAction] = useState<number | string | null>(null)
  const [apiActions, setApiActions] = useState<UiAction[] | null>(null)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    const q = searchQuery?.trim()
    const params = new URLSearchParams()
    params.set("limit", "50")
    if (q) params.set("q", q)

    fetch(`/api/actions?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load actions")
        const data = await res.json()
        const docs: ActionDoc[] = data.actions || []
        const list = docs.map(toUi)
        if (!ignore) setApiActions(list)
      })
      .catch(() => {
        if (!ignore) setApiActions(null)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [searchQuery])

  const source = apiActions && apiActions.length > 0 ? apiActions : (mockActions as unknown as UiAction[])
  const filteredActions = source.filter(
    (action) =>
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.user.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "secondary"
      case "failed":
        return "destructive"
      case "pending":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "voice_query":
      case "voice_command":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300"
      case "appointment_booking":
        return "bg-green-500/10 text-green-700 dark:text-green-300"
      case "database_query":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300"
      case "patient_lookup":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-300"
      case "coverage_verification":
        return "bg-red-500/10 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Actions ({filteredActions.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Chronological history of all system interactions and executed commands
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActions.map((action) => {
            const IconComponent = action.icon
            const isExpanded = expandedAction === action.id

            return (
              <div key={action.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getTypeColor(action.type)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base">{action.title}</h3>
                        <p className="text-sm text-muted-foreground text-pretty mt-1">{action.description}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{action.user}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{action.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Duration: {action.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{action.results}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(action.status) as any}>
                          {action.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {action.status === "failed" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 p-3 bg-muted rounded border">
                        <h4 className="font-semibold text-sm mb-2">Action Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {Object.entries(action.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                              </span>
                              <span className="font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
