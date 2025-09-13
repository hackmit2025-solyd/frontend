import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, AlertTriangle } from "lucide-react"

const mockPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    policy: "Policy X - Premium",
    lastEncounter: "2024-01-15",
    labs: "A1C: 8.2% (High)",
    pcp: "Dr. Smith",
    flags: ["High A1C", "Missed Appointment"],
  },
  {
    id: 2,
    name: "Michael Chen",
    policy: "Policy X - Standard",
    lastEncounter: "2023-11-20",
    labs: "A1C: Overdue",
    pcp: "Dr. Johnson",
    flags: ["Lab Overdue", "No Recent Contact"],
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    policy: "Policy X - Premium",
    lastEncounter: "2024-02-01",
    labs: "A1C: 7.8% (Borderline)",
    pcp: "Dr. Williams",
    flags: ["Medication Adherence"],
  },
]

export function PatientTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Diabetic Patients - Policy X (A1C Test Overdue)
        </CardTitle>
        <p className="text-sm text-muted-foreground">Found 3 patients matching your criteria</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPatients.map((patient) => (
            <div key={patient.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg">{patient.name}</h3>
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
                  <div className="flex gap-1">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
