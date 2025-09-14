"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Phone, Mail, CheckCircle, Clock, User, Target } from "lucide-react"
import { useState } from "react"

export function AgenticToolPanel() {
  const [activeTask, setActiveTask] = useState<string | null>(null)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])

  const executeTask = (taskName: string) => {
    setActiveTask(taskName)
    // Simulate task execution
    setTimeout(() => {
      setActiveTask(null)
      setCompletedTasks((prev) => [...prev, taskName])
    }, 3000)
  }

  return (
    <aside className="w-80 border-l border-border bg-sidebar p-6">
      <div className="space-y-6">
        {/* Available Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={() => executeTask("Book Appointment")}
              disabled={activeTask === "Book Appointment"}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>

            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={() => executeTask("Verify Coverage")}
              disabled={activeTask === "Verify Coverage"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Coverage
            </Button>

            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={() => executeTask("Send Message")}
              disabled={activeTask === "Send Message"}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={() => executeTask("Schedule Follow-up")}
              disabled={activeTask === "Schedule Follow-up"}
            >
              <Phone className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
          </CardContent>
        </Card>

        {/* Active Task Execution */}
        {activeTask && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary animate-spin" />
                Executing Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="font-semibold">{activeTask}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Analyzing patient data...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                    <span>Processing request...</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Finalizing action...</span>
                  </div>
                </div>
                <Progress value={66} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map((task, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-muted rounded">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Dr. Smith</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3 p-2 bg-muted rounded">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Patient Query Executed</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>System</span>
                    <span>•</span>
                    <span>2 min ago</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-muted rounded">
                <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Dashboard Accessed</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Dr. Smith</span>
                    <span>•</span>
                    <span>5 min ago</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
