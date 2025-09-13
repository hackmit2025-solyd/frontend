"use client"

import { useState } from "react"
import { Search, Users, Eye, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientTable } from "@/components/patient-table"
import { Patient360 } from "@/components/patient-360"
import { QueryTranslation } from "@/components/query-translation"
import { AgenticToolPanel } from "@/components/agentic-tool-panel"
import { GraphVisualization } from "@/components/graph-visualization"
import { StatusBar } from "@/components/status-bar"
import { TopNavBar } from "@/components/top-nav-bar"

export default function HealthcareDashboard() {
  const [query, setQuery] = useState("")
  const [showTranslation, setShowTranslation] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "patient360" | "graph">("table")

  const handleSearch = () => {
    setShowTranslation(true)
    // Simulate query processing
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <TopNavBar />

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ask me anything about your patients... e.g., 'Show all diabetic patients on policy X who missed an A1C test in the past year'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 text-base h-12"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2" size="sm">
                Search
              </Button>
            </div>
          </div>

          {/* Query Translation Panel */}
          {showTranslation && (
            <QueryTranslation
              naturalLanguage="Show all diabetic patients on policy X who missed an A1C test in the past year"
              cypherQuery="MATCH (p:Patient)-[:HAS_CONDITION]->(c:Condition {name: 'Diabetes'})
MATCH (p)-[:COVERED_BY]->(pol:Policy {name: 'Policy X'})
WHERE NOT EXISTS {
  (p)-[:HAD_LAB]->(l:Lab {type: 'A1C'})
  WHERE l.date >= date() - duration('P1Y')
}
RETURN p"
            />
          )}

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patient Cohort
              </TabsTrigger>
              <TabsTrigger value="patient360" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Patient 360
              </TabsTrigger>
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Graph View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6">
              <PatientTable />
            </TabsContent>

            <TabsContent value="patient360" className="mt-6">
              <Patient360 />
            </TabsContent>

            <TabsContent value="graph" className="mt-6">
              <GraphVisualization />
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Drawer - Agentic Tool Panel */}
        <AgenticToolPanel />
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}
