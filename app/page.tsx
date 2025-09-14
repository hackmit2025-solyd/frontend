"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PatientTable } from "@/components/patient-table"
import { QueryTranslation } from "@/components/query-translation"
import { GraphVisualization } from "@/components/graph-visualization"
import { StatusBar } from "@/components/status-bar"
import { TopNavBar } from "@/components/top-nav-bar"

export default function HealthcareDashboard() {
  const [query, setQuery] = useState("")
  const [showTranslation, setShowTranslation] = useState(false)
  // Split view state
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // percentage of width for the left pane (30% to 70%)
  const [leftPct, setLeftPct] = useState(50)
  // Fullscreen graph overlay
  const [graphFullscreen, setGraphFullscreen] = useState(false)

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
          resultSummary: "Viewing cohort and graph",
          details: { viewMode: "split", query_id },
        }),
      })
    } catch {
      // ignore logging failure client-side
    }
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const clientX = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      const pct = (x / rect.width) * 100
      const clamped = Math.min(70, Math.max(30, Math.round(pct)))
      setLeftPct(clamped)
    }
    const stop = () => setIsDragging(false)
    window.addEventListener("mousemove", onMove as any)
    window.addEventListener("touchmove", onMove as any, { passive: false })
    window.addEventListener("mouseup", stop)
    window.addEventListener("touchend", stop)
    return () => {
      window.removeEventListener("mousemove", onMove as any)
      window.removeEventListener("touchmove", onMove as any)
      window.removeEventListener("mouseup", stop)
      window.removeEventListener("touchend", stop)
    }
  }, [isDragging])

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

          {/* Split View: Patient Cohort | Graph */}
          <div className="mt-6 border border-border rounded-md overflow-hidden" ref={containerRef}>
            <div className="relative flex w-full h-[70vh] select-none">
              {/* Left Pane */}
              <div
                className="h-full overflow-auto"
                style={{ width: `${leftPct}%` }}
              >
                <div className="h-full p-3">
                  <PatientTable />
                </div>
              </div>

              {/* Divider */}
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                className={`w-1.5 bg-border cursor-col-resize hover:bg-primary transition-colors ${
                  isDragging ? "bg-primary" : ""
                }`}
                style={{ touchAction: "none" }}
                title="Drag to resize"
              />

              {/* Right Pane (Graph) */}
              <div className="h-full flex-1 overflow-hidden">
                <div className="relative h-full p-3">
                  {/* Fullscreen trigger button */}
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute right-6 top-6 z-10"
                    onClick={() => setGraphFullscreen(true)}
                    title="Fullscreen graph"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <div className="h-full overflow-auto">
                    <GraphVisualization key="split-view" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Graph Fullscreen Overlay */}
      {graphFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4">
          <div className="relative h-full">
            <Button
              size="icon"
              variant="outline"
              className="absolute right-4 top-4 z-50"
              onClick={() => setGraphFullscreen(false)}
              title="Close fullscreen"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="h-full overflow-auto">
              <GraphVisualization key="fullscreen" />
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}
