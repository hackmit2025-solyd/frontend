"use client"

import { useState } from "react"
import { Search, Users, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientTable } from "@/components/patient-table"
import { QueryTranslation } from "@/components/query-translation"
import { AgenticToolPanel } from "@/components/agentic-tool-panel"
import { GraphVisualization } from "@/components/graph-visualization"
import { StatusBar } from "@/components/status-bar"
import { TopNavBar } from "@/components/top-nav-bar"

export default function HealthcareDashboard() {
  const [query, setQuery] = useState("")
  const [showTranslation, setShowTranslation] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "graph">("table")

  const handleSearch = async () => {
    setShowTranslation(true)
    const doctor = "Dr. Demo"
    const summary = query.slice(0, 200)
    const query_id = crypto.randomUUID()

    try {
      // Call the new search API route
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          query_id,
        }),
      })

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json()
        console.error("Search failed:", errorData)
      }

      // Log the search action (existing functionality)
      await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "search",
          title: "Search Executed",
          summary,
          doctor,
          query,
          status: "completed",
          resultSummary: viewMode === "table" ? "Viewing patient cohort" : "Viewing graph",
          details: { viewMode, query_id },
        }),
      })
    } catch {
      // ignore logging failure client-side
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
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
                placeholder="Ask me anything about your patients..."
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
              naturalLanguage={query}
              cypherQuery={""}
            />
          )}

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patient Cohort
              </TabsTrigger>
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Graph View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6">
              <PatientTable />
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
