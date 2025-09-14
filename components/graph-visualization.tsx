"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, ZoomIn, ZoomOut, RotateCcw, Download, Filter, Eye, EyeOff } from "lucide-react"
import Sigma from "sigma"
import { MultiGraph } from "graphology"
import { GraphFilters } from "@/components/graph-filters"
import {
  GraphFilters as GraphFiltersType,
  createDefaultFilters,
  filterGraph,
  getNodeTypes,
  getRelationshipTypes,
  getVisibleNodeCount,
  getVisibleEdgeCount
} from "@/lib/graph-filters"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ApiNode {
  id: string
  label: string
  properties: Record<string, any>
  display_name: string
}

interface ApiEdge {
  id: string
  source: string
  target: string
  type: string
  properties: Record<string, any>
}

interface ApiResponse {
  nodes: ApiNode[]
  edges: ApiEdge[]
}


export function GraphVisualization() {
  const vizRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<MultiGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GraphFiltersType>(createDefaultFilters())
  const [availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([])
  const [availableRelationshipTypes, setAvailableRelationshipTypes] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleStats, setVisibleStats] = useState({ nodes: 0, edges: 0 })
  const [legendVisible, setLegendVisible] = useState(true)

  const getNodeColor = (label: string): string => {
    const colors = {
      Patient: "#3b82f6",
      Clinician: "#10b981",
      Encounter: "#f59e0b",
      Symptom: "#ef4444",
      Disease: "#dc2626",
      Test: "#8b5cf6",
      TestResult: "#a855f7",
      Medication: "#06b6d4",
      Procedure: "#f97316",
      Unknown: "#6b7280",
      default: "#6b7280"
    }
    return colors[label as keyof typeof colors] || colors.default
  }

  const fetchGraphData = async (): Promise<ApiResponse> => {
    const response = await fetch('https://api.solyd.serve.cx/api/graph/full', {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch graph data')
    }

    return response.json()
  }

  const createGraphFromApiData = (apiData: ApiResponse) => {
    const graph = new MultiGraph()

    // Add nodes with proper positioning
    apiData.nodes.forEach((node) => {
      // Create circular layout based on node type
      const nodesByType = apiData.nodes.filter(n => n.label === node.label)
      const typeIndex = nodesByType.findIndex(n => n.id === node.id)
      const totalOfType = nodesByType.length

      // Different radii for different node types
      const radiusMap: Record<string, number> = {
        Patient: 200,
        Clinician: 150,
        Encounter: 100,
        Symptom: 250,
        Disease: 300,
        Test: 180,
        TestResult: 120,
        Medication: 220,
        Procedure: 160,
        Unknown: 80
      }

      const radius = radiusMap[node.label] || 100
      const angle = (typeIndex * 2 * Math.PI) / Math.max(totalOfType, 1)

      // Add some randomness to avoid perfect circles
      const randomOffset = (Math.random() - 0.5) * 50

      graph.addNode(node.id, {
        label: node.display_name,
        x: Math.cos(angle) * radius + randomOffset,
        y: Math.sin(angle) * radius + randomOffset,
        size: node.label === 'Patient' ? 20 : node.label === 'Clinician' ? 18 : 12,
        color: getNodeColor(node.label),
        properties: { ...node.properties, nodeType: node.label }
      })
    })

    // Add edges
    apiData.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          id: edge.id,
          label: edge.type,
          color: "#94a3b8",
          properties: edge.properties
        })
      }
    })

    return graph
  }

  const initializeGraph = async (): Promise<void> => {
    if (!vizRef.current) return

    try {
      setLoading(true)
      setError(null)

      // Clean up any existing instance
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }

      // Clear the container
      if (vizRef.current) {
        vizRef.current.innerHTML = ''
      }

      const apiData = await fetchGraphData()
      const graph = createGraphFromApiData(apiData)
      graphRef.current = graph

      // Extract available types for filters
      const nodeTypes = getNodeTypes(graph)
      const relationshipTypes = getRelationshipTypes(graph)
      setAvailableNodeTypes(nodeTypes)
      setAvailableRelationshipTypes(relationshipTypes)

      // Initialize filters with all available types
      const initialFilters: GraphFiltersType = {
        nodes: {
          nodeTypes: nodeTypes,
          showAll: true
        },
        edges: {
          relationshipTypes: relationshipTypes,
          showAll: true
        }
      }
      setFilters(initialFilters)

      if (!vizRef.current) return // Double check after async operation

      sigmaRef.current = new Sigma(graph, vizRef.current, {
        renderEdgeLabels: true,
        defaultNodeColor: "#6b7280",
        defaultEdgeColor: "#94a3b8",
        labelColor: { color: "#374151" },
        labelSize: 10,
        labelWeight: "600",
        edgeLabelColor: { color: "#6b7280" },
        edgeLabelSize: 8,
        edgeLabelWeight: "400"
      })

      // Add hover events
      sigmaRef.current.on("enterNode", (event) => {
        const node = graph.getNodeAttributes(event.node)
        console.log("Node hovered:", node)
      })

      sigmaRef.current.on("clickNode", (event) => {
        const node = graph.getNodeAttributes(event.node)
        console.log("Node clicked:", node)
      })

      // Update visible stats
      updateVisibleStats(graph)

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize graph")
      setLoading(false)
    }
  }

  const handleZoomIn = (): void => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      camera.animatedZoom({ duration: 300 })
    }
  }

  const handleZoomOut = (): void => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      camera.animatedUnzoom({ duration: 300 })
    }
  }

  const handleReset = (): void => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      camera.animatedReset({ duration: 500 })
    }
  }

  const handleExport = (): void => {
    console.log("Export functionality - would export current graph view")
  }

  const updateVisibleStats = (graph: MultiGraph): void => {
    setVisibleStats({
      nodes: getVisibleNodeCount(graph),
      edges: getVisibleEdgeCount(graph)
    })
  }

  const applyFilters = (): void => {
    if (!graphRef.current || !sigmaRef.current) return

    filterGraph(graphRef.current, filters)
    sigmaRef.current.refresh()
    updateVisibleStats(graphRef.current)
  }

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

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted && vizRef.current) {
        // Check if the container is actually visible
        const rect = vizRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          await initializeGraph()
        }
      }
    }

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      init()
    }, 100)

    return () => {
      mounted = false
      clearTimeout(timer)
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }
    }
  }, [])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Patient Network Graph
            {!loading && (
              <span className="text-sm text-muted-foreground font-normal">
                ({visibleStats.nodes} nodes, {visibleStats.edges} edges)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLegendVisible(!legendVisible)}
            >
              {legendVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Legend
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Interactive visualization of patient relationships and care networks
        </p>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            {!loading && availableNodeTypes.length > 0 && (
              <GraphFilters
                nodeTypes={availableNodeTypes}
                selectedNodeTypes={filters.nodes.nodeTypes}
                onNodeTypesChange={handleNodeTypesChange}
                showAllNodes={filters.nodes.showAll}
                onShowAllNodesChange={handleShowAllNodesChange}
                relationshipTypes={availableRelationshipTypes}
                selectedRelationshipTypes={filters.edges.relationshipTypes}
                onRelationshipTypesChange={handleRelationshipTypesChange}
                showAllRelationships={filters.edges.showAll}
                onShowAllRelationshipsChange={handleShowAllRelationshipsChange}
              />
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-muted rounded-lg border-2 border-dashed border-border">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading graph visualization...</div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-red-500">Error: {error}</div>
            </div>
          )}

          {/* Sigma.js Graph Visualization Container */}
          <div
            ref={vizRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: loading ? 0 : 1 }}
          />

          {/* Legend */}
          {!loading && !error && legendVisible && (
            <div className="absolute bottom-4 left-4 bg-background border border-border rounded p-3 space-y-2 z-10">
              <h4 className="font-semibold text-sm">Legend</h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#3b82f6" }}></div>
                <span>Patients</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#10b981" }}></div>
                <span>Clinicians</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }}></div>
                <span>Encounters</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
                <span>Symptoms</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#dc2626" }}></div>
                <span>Diseases</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#8b5cf6" }}></div>
                <span>Tests</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#06b6d4" }}></div>
                <span>Medications</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Interactive Sigma.js graph visualization • Healthcare network data</span>
          <span>Click nodes for details • Drag to pan • Scroll to zoom</span>
        </div>
      </CardContent>
    </Card>
  )
}
