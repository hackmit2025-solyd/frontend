import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"

const mockPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    policy: "Policy X - Premium",
    lastEncounter: "2024-01-15",
    labs: "Routine labs reviewed",
    pcp: "Dr. Smith",
    flags: ["Follow-up recommended"],
  },
  {
    id: 2,
    name: "Michael Chen",
    policy: "Policy X - Standard",
    lastEncounter: "2023-11-20",
    labs: "Labs pending",
    pcp: "Dr. Johnson",
    flags: ["No recent contact"],
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    policy: "Policy X - Premium",
    lastEncounter: "2024-02-01",
    labs: "Vitals within normal range",
    pcp: "Dr. Williams",
    flags: ["Medication adherence"],
  },
]

export function PatientTable() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const toggle = (id: number) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Patient Cohort
        </CardTitle>
        <p className="text-sm text-muted-foreground">Found 3 patients in the current view</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPatients.map((patient) => {
            const isOpen = expandedId === patient.id
            return (
              <div
                key={patient.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggle(patient.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.policy}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Last Encounter</p>
                    <p className="text-sm text-muted-foreground">{patient.lastEncounter}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Labs</p>
                    <p className="text-sm text-muted-foreground">{patient.labs}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">PCP</p>
                    <p className="text-sm text-muted-foreground">{patient.pcp}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {patient.flags.map((flag, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Contact & PCP</h4>
                        <p className="text-sm text-muted-foreground">Primary: {patient.pcp}</p>
                        <p className="text-sm text-muted-foreground">Phone: (555) 000-0000</p>
                        <p className="text-sm text-muted-foreground">Email: patient@example.com</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Coverage</h4>
                        <Badge variant="secondary" className="mb-2">{patient.policy}</Badge>
                        <p className="text-sm text-muted-foreground">Status: Active</p>
                        <p className="text-sm text-muted-foreground">PCP: {patient.pcp}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground">{patient.labs}</p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline">Follow-up</Badge>
                          <Badge variant="outline">Review</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
