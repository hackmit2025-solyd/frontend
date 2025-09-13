import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, Mail, Heart, Activity, AlertCircle } from "lucide-react"

export function Patient360() {
  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Sarah Johnson</CardTitle>
              <p className="text-muted-foreground">DOB: March 15, 1978 • Age: 46 • MRN: 12345678</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground">Phone: (555) 123-4567</p>
              <p className="text-sm text-muted-foreground">Email: sarah.j@email.com</p>
              <p className="text-sm text-muted-foreground">Address: 123 Main St, City, ST 12345</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Insurance Coverage</h4>
              <Badge variant="secondary" className="mb-2">
                Policy X - Premium
              </Badge>
              <p className="text-sm text-muted-foreground">Active since: Jan 2020</p>
              <p className="text-sm text-muted-foreground">PCP: Dr. Smith</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Active Alerts</h4>
              <div className="space-y-1">
                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                  <AlertCircle className="h-3 w-3" />
                  Follow-up Needed
                </Badge>
                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                  <AlertCircle className="h-3 w-3" />
                  Action Required
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline and Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encounter Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Encounters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Annual Physical</h4>
                  <span className="text-sm text-muted-foreground">Jan 15, 2024</span>
                </div>
                <p className="text-sm text-muted-foreground">Dr. Smith • Lab results reviewed</p>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline">Diabetes Management</Badge>
                  <Badge variant="outline">Medication Review</Badge>
                </div>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Follow-up Visit</h4>
                  <span className="text-sm text-muted-foreground">Oct 20, 2023</span>
                </div>
                <p className="text-sm text-muted-foreground">Dr. Smith • Follow-up notes added</p>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline">Lab Review</Badge>
                </div>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Diabetes Education</h4>
                  <span className="text-sm text-muted-foreground">Aug 5, 2023</span>
                </div>
                <p className="text-sm text-muted-foreground">Nurse Educator</p>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline">Education</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Active Coverage & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Chronic Conditions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Type 2 Diabetes</span>
                    <Badge variant="destructive">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Hypertension</span>
                    <Badge variant="secondary">Controlled</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Current Medications</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Metformin 1000mg</span>
                    <Badge variant="secondary">2x daily</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Lisinopril 10mg</span>
                    <Badge variant="secondary">1x daily</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Coverage Benefits</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Annual Deductible:</span>
                    <span>$500 / $1,500</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Preventive Care:</span>
                    <span className="text-green-600">100% Covered</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Specialist Copay:</span>
                    <span>$40</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
