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
import { useState } from "react"

interface ActionHistoryProps {
  searchQuery: string
}

const mockActions = [
  {
    id: 1,
    type: "voice_query",
    title: "Voice Query: Diabetic Patients",
    description: "Show all diabetic patients on policy X who missed an A1C test in the past year",
    user: "Dr. Smith",
    timestamp: "2024-01-15 14:30:22",
    status: "completed",
    duration: "2.3s",
    results: "3 patients found",
    icon: Mic,
    details: {
      audioLength: "8.2s",
      transcriptionAccuracy: "98%",
      queryGenerated: "MATCH (p:Patient)-[:HAS_CONDITION]->(c:Condition {name: 'Diabetes'})...",
    },
  },
  {
    id: 2,
    type: "appointment_booking",
    title: "Appointment Scheduled",
    description: "Booked follow-up appointment for Sarah Johnson",
    user: "Dr. Smith",
    timestamp: "2024-01-15 14:25:15",
    status: "completed",
    duration: "1.8s",
    results: "Appointment confirmed",
    icon: Calendar,
    details: {
      patientId: "12345678",
      appointmentDate: "2024-01-22 10:00 AM",
      appointmentType: "Follow-up",
    },
  },
  {
    id: 3,
    type: "database_query",
    title: "Patient Cohort Analysis",
    description: "Retrieved patient data for diabetes management program",
    user: "System",
    timestamp: "2024-01-15 14:20:45",
    status: "completed",
    duration: "0.8s",
    results: "127 records processed",
    icon: Database,
    details: {
      queryType: "Cypher",
      recordsScanned: "1,247",
      recordsReturned: "127",
    },
  },
  {
    id: 4,
    type: "voice_command",
    title: "Voice Command: Send Message",
    description: "Sent medication reminder to Michael Chen",
    user: "Dr. Johnson",
    timestamp: "2024-01-15 13:45:30",
    status: "completed",
    duration: "3.1s",
    results: "Message sent",
    icon: Phone,
    details: {
      audioLength: "12.5s",
      messageType: "SMS",
      deliveryStatus: "Delivered",
    },
  },
  {
    id: 5,
    type: "patient_lookup",
    title: "Patient 360 View",
    description: "Accessed comprehensive patient profile for Emily Rodriguez",
    user: "Dr. Williams",
    timestamp: "2024-01-15 13:30:12",
    status: "completed",
    duration: "1.2s",
    results: "Profile loaded",
    icon: Eye,
    details: {
      patientId: "87654321",
      sectionsLoaded: "Demographics, Encounters, Labs, Medications",
      dataPoints: "47",
    },
  },
  {
    id: 6,
    type: "coverage_verification",
    title: "Insurance Verification Failed",
    description: "Unable to verify coverage for patient John Doe",
    user: "System",
    timestamp: "2024-01-15 12:15:08",
    status: "failed",
    duration: "5.2s",
    results: "Verification timeout",
    icon: AlertTriangle,
    details: {
      errorCode: "TIMEOUT_001",
      retryAttempts: "3",
      lastResponse: "Gateway timeout",
    },
  },
]

export function ActionHistory({ searchQuery }: ActionHistoryProps) {
  const [expandedAction, setExpandedAction] = useState<number | null>(null)

  const filteredActions = mockActions.filter(
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
