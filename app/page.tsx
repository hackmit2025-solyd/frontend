"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Maximize2, X, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { PatientTable } from "@/components/patient-table"
import { QueryTranslation } from "@/components/query-translation"
import dynamic from "next/dynamic"
import { StatusBar } from "@/components/status-bar"
import { TopNavBar } from "@/components/top-nav-bar"
import { useHipaa } from "@/components/hipaa-provider"
import {
  GraphFilters as GraphFiltersType,
  createDefaultFilters,
} from "@/lib/graph-filters"

export default function HealthcareDashboard() {
  const [query, setQuery] = useState("")
  const [showTranslation, setShowTranslation] = useState(false)
  const { hipaaEnabled } = useHipaa()
  // Split view state
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // percentage of width for the left pane (30% to 70%)
  const [leftPct, setLeftPct] = useState(50)
  // Fullscreen graph overlay
  const [graphFullscreen, setGraphFullscreen] = useState(false)

  const [graphData, setGraphData] = useState<any>(null)
  const [cypherUsed, setCypherUsed] = useState<string>("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Shared filter state for both graph instances
  const [filters, setFilters] = useState<GraphFiltersType>(createDefaultFilters())
  const [availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([])
  const [availableRelationshipTypes, setAvailableRelationshipTypes] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filter handler functions
  const handleNodeTypesChange = (nodeTypes: string[]): void => {
    setFilters(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        nodeTypes,
        showAll: false
      }
    }))
  }

  const handleShowAllNodesChange = (showAll: boolean): void => {
    setFilters(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        showAll,
        nodeTypes: showAll ? availableNodeTypes : prev.nodes.nodeTypes
      }
    }))
  }

  const handleRelationshipTypesChange = (relationshipTypes: string[]): void => {
    setFilters(prev => ({
      ...prev,
      edges: {
        ...prev.edges,
        relationshipTypes,
        showAll: false
      }
    }))
  }

  const handleShowAllRelationshipsChange = (showAll: boolean): void => {
    setFilters(prev => ({
      ...prev,
      edges: {
        ...prev.edges,
        showAll,
        relationshipTypes: showAll ? availableRelationshipTypes : prev.edges.relationshipTypes
      }
    }))
  }

  const handleSearch = async () => {
    setSearchLoading(true)
    setLoadingProgress(0)

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)
    setShowTranslation(true)
    const doctor = "Dr. Demo"
    const summary = query.slice(0, 200)
    const query_id = crypto.randomUUID()

    try {
      // Call the query-graph API endpoint
      const queryGraphResponse = await fetch(`/api/search/query-graph?hipaa=${hipaaEnabled}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: 50,
        }),
      })

      if (queryGraphResponse.ok) {
        const graphData = await queryGraphResponse.json()
        console.log("Query Graph Response Data:", graphData)
        console.log("Nodes count:", graphData.nodes?.length || 0)
        console.log("Edges count:", graphData.edges?.length || 0)
        console.log("Sample nodes:", graphData.nodes?.slice(0, 3))
        console.log("Sample edges:", graphData.edges?.slice(0, 3))
        setGraphData(graphData)
        // Extract cypher-used from response for display
        const cypher = (graphData && (graphData["cypher-used"] ?? graphData["cypher_used"] ?? graphData["cypherUsed"]))
        if (cypher) {
          setCypherUsed(typeof cypher === 'string' ? cypher : JSON.stringify(cypher, null, 2))
        } else {
          setCypherUsed("")
        }
      } else {
        const errorData = await queryGraphResponse.json()
        console.error("Query graph search failed:", errorData)
      }

      /*
      // Call the original search API route
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
      */

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
          details: { viewMode: "split", query_id, hipaaEnabled },
        }),
      })
    } catch {
      // ignore logging failure client-side
    } finally {
      // Complete progress and clean up
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setTimeout(() => {
        setSearchLoading(false)
        setLoadingProgress(0)
      }, 300)
    }
  }

  const handleSearchAgent = async () => {
    // First, perform the regular search to get the graph data
    await handleSearch()

    // Then call the LLM route with the graph data
    setAgentLoading(true)
    const agent_id = Math.floor(Math.random() * 1000000) // Generate random integer UUID

    try {
      const llmResponse = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: agent_id,
          query,
          graphData,
        }),
      })

      if (llmResponse.ok) {
        const llmData = await llmResponse.json()
        console.log("LLM Response:", llmData)
      } else {
        const errorData = await llmResponse.json()
        console.error("LLM request failed:", errorData)
      }
    } catch (error) {
      console.error("LLM request error:", error)
    } finally {
      setAgentLoading(false)
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
    <div className="min-h-screen bg-background text-foreground pb-0 flex flex-col">
      {/* Top Navigation */}
      <TopNavBar />

      <div className="flex-1 min-h-0 flex">
        {/* Main Content */}
        <main className="flex-1 p-6 flex flex-col min-h-0">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ask me anything about your patients..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-44 text-base h-12"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  onClick={handleSearch}
                  size="sm"
                  disabled={searchLoading || agentLoading}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {searchLoading ? "Searching..." : "Search"}
                </Button>
                <Button
                  onClick={handleSearchAgent}
                  size="sm"
                  disabled={searchLoading || agentLoading}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {agentLoading ? "Agent Working..." : "Search & Agent"}
                </Button>
              </div>
            </div>

            {/* Loading Bar */}
            {searchLoading && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {loadingProgress < 30 ? "Processing natural language query..." :
                     loadingProgress < 60 ? "Analyzing patient data..." :
                     loadingProgress < 90 ? "Building knowledge graph..." :
                     "Finalizing results..."}
                  </span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>
                <Progress value={loadingProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* Query Translation Panel */}
          {showTranslation && (
            <QueryTranslation
              naturalLanguage={query}
              cypherQuery={cypherUsed}
            />
          )}

          {/* Split View: Patient Cohort | Graph */}
          <div className="mt-6 border border-border rounded-md overflow-hidden flex-1 min-h-0" ref={containerRef}>
            <div className="relative flex w-full h-full select-none">
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
                    <GraphVisualization
                      key="shared"
                      data={graphData}
                      filters={filters}
                      availableNodeTypes={availableNodeTypes}
                      availableRelationshipTypes={availableRelationshipTypes}
                      filtersOpen={filtersOpen}
                      onFiltersChange={setFilters}
                      onAvailableNodeTypesChange={setAvailableNodeTypes}
                      onAvailableRelationshipTypesChange={setAvailableRelationshipTypes}
                      onFiltersOpenChange={setFiltersOpen}
                      onNodeTypesChange={handleNodeTypesChange}
                      onShowAllNodesChange={handleShowAllNodesChange}
                      onRelationshipTypesChange={handleRelationshipTypesChange}
                      onShowAllRelationshipsChange={handleShowAllRelationshipsChange}
                    />
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
              <GraphVisualization
                key="shared"
                data={graphData}
                filters={filters}
                availableNodeTypes={availableNodeTypes}
                availableRelationshipTypes={availableRelationshipTypes}
                filtersOpen={filtersOpen}
                onFiltersChange={setFilters}
                onAvailableNodeTypesChange={setAvailableNodeTypes}
                onAvailableRelationshipTypesChange={setAvailableRelationshipTypes}
                onFiltersOpenChange={setFiltersOpen}
                onNodeTypesChange={handleNodeTypesChange}
                onShowAllNodesChange={handleShowAllNodesChange}
                onRelationshipTypesChange={handleRelationshipTypesChange}
                onShowAllRelationshipsChange={handleShowAllRelationshipsChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}

// Client-only GraphVisualization to avoid SSR/WebGL issues
const GraphVisualization = dynamic(
  () => import("@/components/graph-visualization").then(m => m.GraphVisualization),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        Loading graph...
      </div>
    ),
  }
)
