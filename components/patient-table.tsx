import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, AlertTriangle, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useCohort } from "@/components/cohort-provider"

export function PatientTable() {
  const { patients, removePatient } = useCohort()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Patient Cohort
        </CardTitle>
        <p className="text-sm text-muted-foreground">{patients.length} patient{patients.length === 1 ? '' : 's'} in cohort</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.length === 0 && (
            <div className="text-sm text-muted-foreground">No patients in cohort yet. Add from the graph.</div>
          )}
          {patients.map((patient) => {
            const isOpen = expandedId === patient.id
            return (
              <div
                key={patient.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggle(patient.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">{patient.displayName}</h3>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {patient.policy && (
                      <p className="text-sm text-muted-foreground truncate">{patient.policy}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">{patient.dob || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Sex</p>
                    <p className="text-sm text-muted-foreground truncate">{patient.sex || "—"}</p>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap gap-1 max-w-full" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="shrink-0 whitespace-nowrap"
                        onClick={() => removePatient(patient.id)}
                        title="Remove from cohort"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Demographics</h4>
                        <p className="text-sm text-muted-foreground">Date of Birth: {patient.dob || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Sex: {patient.sex || "N/A"}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Contact</h4>
                        {patient.pcp && (
                          <p className="text-sm text-muted-foreground">Primary: {patient.pcp}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Phone: {patient.contactPhone || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Email: {patient.contactEmail || "N/A"}</p>
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
