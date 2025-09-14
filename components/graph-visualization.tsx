"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, ZoomIn, ZoomOut, RotateCcw, Filter, Eye, EyeOff } from "lucide-react"
import Sigma from "sigma"
import { MultiGraph } from "graphology"
import { GraphFilters } from "@/components/graph-filters"
import { NodeTooltip, NodeTooltipData } from "@/components/node-tooltip"
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

interface GraphVisualizationProps {
  data?: ApiResponse
}

export function GraphVisualization({ data }: GraphVisualizationProps) {
  const vizRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<MultiGraph | null>(null)
  const tooltipPinnedRef = useRef<boolean>(false)
  const hoveringTooltipRef = useRef<boolean>(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GraphFiltersType>(createDefaultFilters())
  const [availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([])
  const [availableRelationshipTypes, setAvailableRelationshipTypes] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleStats, setVisibleStats] = useState({ nodes: 0, edges: 0 })
  const [legendVisible, setLegendVisible] = useState(true)
  const [tooltipData, setTooltipData] = useState<NodeTooltipData | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPinned, setTooltipPinned] = useState(false)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const [hoveringTooltip, setHoveringTooltip] = useState(false)

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

  const updateGraphWithData = (apiData: ApiResponse) => {
    if (!vizRef.current || !apiData?.nodes || !apiData?.edges) return

    try {
      // Clean up any existing instance
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }

      // Clear the container
      if (vizRef.current) {
        vizRef.current.innerHTML = ''
      }

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

      if (!vizRef.current) return // Double check after operations

      sigmaRef.current = new Sigma(graph, vizRef.current, {
        renderEdgeLabels: true,
        defaultNodeColor: "#6b7280",
        defaultEdgeColor: "#94a3b8",
        labelColor: { color: "#374151" },
        labelSize: 10,
        labelWeight: "600",
        edgeLabelColor: { color: "#1f2937" },
        edgeLabelSize: 12,
        edgeLabelWeight: "600",
        edgeLabelFont: "Inter, Arial, sans-serif",
        // GPU-friendly performance optimizations
        performanceMode: true,
        allowInvalidContainer: false,
        hideLabelsOnMove: true,
        hideEdgesOnMove: true,
        labelGridCellSize: 100,
        labelDensity: 1,
        zIndex: true
      })

      // Add all the event handlers
      setupEventHandlers(graph)

      // Update container rect for tooltip positioning
      if (vizRef.current) {
        setContainerRect(vizRef.current.getBoundingClientRect())
      }

      // Update visible stats
      updateVisibleStats(graph)

      setLoading(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update graph")
      setLoading(false)
    }
  }

  const setupEventHandlers = (graph: MultiGraph) => {
    if (!sigmaRef.current) return

    // Add hover and click events for tooltip
    sigmaRef.current.on("enterNode", (event) => {
      const node = graph.getNodeAttributes(event.node)
      if (!tooltipPinned) {
        showTooltip(event.node, node, false)
      }
    })

    sigmaRef.current.on("leaveNode", (event) => {
      // Clear any existing timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }

      // Only hide tooltip on node leave if it's not pinned
      // Use a small delay to allow mouse to move to tooltip area
      if (!tooltipPinnedRef.current) {
        leaveTimeoutRef.current = setTimeout(() => {
          if (!tooltipPinnedRef.current && !hoveringTooltipRef.current) {
            hideTooltip()
          }
        }, 150)
      }
    })

    sigmaRef.current.on("clickNode", (event) => {
      // Clear any pending hide timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
        leaveTimeoutRef.current = null
      }

      const node = graph.getNodeAttributes(event.node)
      showTooltip(event.node, node, true)
      setTooltipPinned(true)
      tooltipPinnedRef.current = true
    })

    sigmaRef.current.on("clickStage", () => {
      if (tooltipPinnedRef.current) {
        hideTooltip()
      }
    })

    // Add edge hover effects for better highlighting (GPU-optimized)
    sigmaRef.current.on("enterEdge", (event) => {
      const edge = graph.getEdgeAttributes(event.edge)
      // Highlight the edge by making it thicker and brighter
      graph.setEdgeAttribute(event.edge, "size", 4)
      graph.setEdgeAttribute(event.edge, "color", edge.originalColor + "FF") // Full opacity for highlight
      // Use requestAnimationFrame for smooth GPU rendering
      requestAnimationFrame(() => {
        sigmaRef.current?.refresh()
      })
    })

    sigmaRef.current.on("leaveEdge", (event) => {
      const edge = graph.getEdgeAttributes(event.edge)
      // Reset edge to original appearance
      graph.setEdgeAttribute(event.edge, "size", 2)
      graph.setEdgeAttribute(event.edge, "color", edge.originalColor)
      // Use requestAnimationFrame for smooth GPU rendering
      requestAnimationFrame(() => {
        sigmaRef.current?.refresh()
      })
    })
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

      // Use properties.name for Test nodes, properties.reason for Encounter nodes, otherwise use display_name
      const displayLabel = node.label === 'Test' && node.properties?.name
        ? node.properties.name
        : node.label === 'Encounter' && node.properties?.reason
        ? node.properties.reason
        : node.display_name

      graph.addNode(node.id, {
        label: displayLabel,
        x: Math.cos(angle) * radius + randomOffset,
        y: Math.sin(angle) * radius + randomOffset,
        size: node.label === 'Patient' ? 20 : node.label === 'Clinician' ? 18 : 12,
        color: getNodeColor(node.label),
        properties: { ...node.properties, nodeType: node.label }
      })
    })

    // Add edges with better styling
    apiData.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        // Get edge color based on relationship type
        const getEdgeColor = (type: string): string => {
          const edgeColors = {
            'HAS_ENCOUNTER': '#3b82f6',
            'HAS_SYMPTOM': '#ef4444',
            'DIAGNOSED_WITH': '#dc2626',
            'PRESCRIBED': '#06b6d4',
            'PERFORMED': '#f97316',
            'TESTED_FOR': '#8b5cf6',
            'TREATED_BY': '#10b981',
            default: '#64748b'
          }
          return edgeColors[type as keyof typeof edgeColors] || edgeColors.default
        }

        graph.addEdge(edge.source, edge.target, {
          id: edge.id,
          label: edge.type,
          color: getEdgeColor(edge.type),
          size: 2,
          originalColor: getEdgeColor(edge.type),
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
        edgeLabelColor: { color: "#1f2937" },
        edgeLabelSize: 12,
        edgeLabelWeight: "600",
        edgeLabelFont: "Inter, Arial, sans-serif",
        // GPU-friendly performance optimizations
        performanceMode: true,
        allowInvalidContainer: false,
        hideLabelsOnMove: true,
        hideEdgesOnMove: true,
        labelGridCellSize: 100,
        labelDensity: 1,
        zIndex: true
      })

      // Add all the event handlers
      setupEventHandlers(graph)

      // Update container rect for tooltip positioning
      if (vizRef.current) {
        setContainerRect(vizRef.current.getBoundingClientRect())
      }

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

  // Export button removed

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

  const showTooltip = (nodeId: string, nodeAttributes: any, pinned: boolean): void => {
    if (!sigmaRef.current || !vizRef.current) return

    // Convert graph coordinates to screen coordinates
    const screenPos = sigmaRef.current.graphToViewport({
      x: nodeAttributes.x,
      y: nodeAttributes.y
    })

    const tooltipData: NodeTooltipData = {
      id: nodeId,
      label: nodeAttributes.label || nodeId,
      nodeType: nodeAttributes.properties?.nodeType || 'Unknown',
      properties: nodeAttributes.properties || {},
      x: screenPos.x,
      y: screenPos.y,
      graphX: nodeAttributes.x,
      graphY: nodeAttributes.y
    }

    setTooltipData(tooltipData)
    setTooltipVisible(true)
    if (pinned) {
      setTooltipPinned(true)
    }
  }

  const hideTooltip = (): void => {
    // Clear any pending timeouts
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    setTooltipVisible(false)
    setTooltipPinned(false)
    setHoveringTooltip(false)

    // Update refs
    tooltipPinnedRef.current = false
    hoveringTooltipRef.current = false

    setTimeout(() => {
      setTooltipData(null)
    }, 200)
  }

  const handleTooltipMouseEnter = (): void => {
    // Clear any pending hide timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    setHoveringTooltip(true)
    hoveringTooltipRef.current = true
  }

  const handleTooltipMouseLeave = (): void => {
    setHoveringTooltip(false)
    hoveringTooltipRef.current = false

    // If not pinned, hide tooltip when mouse leaves tooltip area
    if (!tooltipPinnedRef.current) {
      leaveTimeoutRef.current = setTimeout(() => {
        // Check the current state at the time of execution
        if (!tooltipPinnedRef.current && !hoveringTooltipRef.current) {
          hideTooltip()
        }
      }, 100)
    }
  }

  // Watch for data prop changes
  useEffect(() => {
    if (data && vizRef.current) {
      // Check if the container is actually visible
      const rect = vizRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setLoading(true)
        updateGraphWithData(data)
      }
    }
  }, [data])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted && vizRef.current) {
        // Check if the container is actually visible
        const rect = vizRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          // Only initialize with default data if no search data is provided
          if (!data) {
            await initializeGraph()
          }
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
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
        leaveTimeoutRef.current = null
      }
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

  // Update container rect on resize
  useEffect(() => {
    const updateContainerRect = () => {
      if (vizRef.current) {
        setContainerRect(vizRef.current.getBoundingClientRect())
      }
    }

    const resizeObserver = new ResizeObserver(updateContainerRect)
    if (vizRef.current) {
      resizeObserver.observe(vizRef.current)
    }

    window.addEventListener('resize', updateContainerRect)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateContainerRect)
    }
  }, [])

  // Update tooltip position on camera changes
  useEffect(() => {
    if (!sigmaRef.current) return

    const handleCameraUpdate = () => {
      if (tooltipVisible && tooltipData && !tooltipPinned && tooltipData.graphX !== undefined && tooltipData.graphY !== undefined) {
        // Update tooltip position when camera moves during hover
        const screenPos = sigmaRef.current!.graphToViewport({
          x: tooltipData.graphX,
          y: tooltipData.graphY
        })
        setTooltipData(prev => prev ? {
          ...prev,
          x: screenPos.x,
          y: screenPos.y
        } : null)
      }
    }

    sigmaRef.current.getCamera().on('updated', handleCameraUpdate)

    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.getCamera().off('updated', handleCameraUpdate)
      }
    }
  }, [tooltipVisible, tooltipData, tooltipPinned])

  return (
    <Card className="h-full flex flex-col">
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
            {/* Export button removed */}
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
      <CardContent className="flex-1 overflow-hidden">
        <div className="relative h-full bg-muted rounded-lg border-2 border-dashed border-border">
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

          {/* Node Tooltip */}
          <NodeTooltip
            data={tooltipData}
            visible={tooltipVisible}
            pinned={tooltipPinned}
            containerRect={containerRect || undefined}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          />

          {/* Legend */}
          {!loading && !error && legendVisible && (
            <div className="absolute bottom-4 left-4 bg-background border border-border rounded p-3 space-y-2 z-10 max-h-[50vh] overflow-y-auto">
              <h4 className="font-semibold text-sm">Node Types</h4>
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

              <div className="border-t pt-2 mt-3">
                <h4 className="font-semibold text-sm mb-2">Edge Types</h4>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
                  <span>Has Encounter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                  <span>Has Symptom</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#dc2626" }}></div>
                  <span>Diagnosed With</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#06b6d4" }}></div>
                  <span>Prescribed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#f97316" }}></div>
                  <span>Performed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
                  <span>Tested For</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: "#10b981" }}></div>
                  <span>Treated By</span>
                </div>
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
