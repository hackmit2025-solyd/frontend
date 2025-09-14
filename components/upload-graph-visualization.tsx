"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from "lucide-react"
import { MultiGraph } from "graphology"
import { NodeTooltip, NodeTooltipData } from "@/components/node-tooltip"

interface UploadNode {
  id: string
  type: "Patient" | "Encounter" | "Symptom" | "Disease" | "Test" | "TestResult" | "Medication" | "SourceDocument" | "Assertion"
  properties: Record<string, any>
}

interface UploadRelationship {
  id: string
  type: string
  source: string
  target: string
  properties: Record<string, any>
}

interface UploadGraphData {
  nodes: UploadNode[]
  relationships: UploadRelationship[]
}

interface UploadGraphVisualizationProps {
  data: UploadGraphData
  documentId: string
  fileName: string
}

// Edge color mapping for different relationship types
const EDGE_COLOR_MAP: Record<string, string> = {
  'HAS_ENCOUNTER': '#3b82f6',
  'HAS_SYMPTOM': '#ef4444',
  'DIAGNOSED_WITH': '#dc2626',
  'PRESCRIBED': '#06b6d4',
  'PERFORMED': '#f97316',
  'TESTED_FOR': '#8b5cf6',
  'TREATED_BY': '#10b981',
  default: '#64748b'
}

const getEdgeColor = (type: string): string => {
  return EDGE_COLOR_MAP[type] || EDGE_COLOR_MAP.default
}

export function UploadGraphVisualization({
  data,
  documentId,
  fileName
}: UploadGraphVisualizationProps) {
  const vizRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<any>(null)
  const graphRef = useRef<MultiGraph | null>(null)
  const tooltipPinnedRef = useRef<boolean>(false)
  const hoveringTooltipRef = useRef<boolean>(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sigmaLoaded, setSigmaLoaded] = useState(false)
  const [legendVisible, setLegendVisible] = useState(true)
  const [tooltipData, setTooltipData] = useState<NodeTooltipData | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPinned, setTooltipPinned] = useState(false)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const [hoveringTooltip, setHoveringTooltip] = useState(false)

  // Dynamic Sigma import function
  const loadSigma = async () => {
    if (typeof window === 'undefined') return null
    try {
      const SigmaModule = await import('sigma')
      setSigmaLoaded(true)
      return SigmaModule.default
    } catch (error) {
      console.error('Failed to load Sigma:', error)
      setError('Failed to load graph visualization library')
      return null
    }
  }

  const getNodeColor = (type: string): string => {
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
      SourceDocument: "#9ca3af",
      Assertion: "#84cc16",
      Unknown: "#6b7280",
      default: "#6b7280"
    }
    return colors[type as keyof typeof colors] || colors.default
  }

  const createGraphFromUploadData = (uploadData: UploadGraphData) => {
    const graph = new MultiGraph()

    // Add nodes with proper positioning
    uploadData.nodes.forEach((node, index) => {
      // Create circular layout based on node type
      const nodesByType = uploadData.nodes.filter(n => n.type === node.type)
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
        SourceDocument: 80,
        Assertion: 140,
        Unknown: 100
      }

      const radius = radiusMap[node.type] || 100
      const angle = (typeIndex * 2 * Math.PI) / Math.max(totalOfType, 1)

      // Add some randomness to avoid perfect circles
      const randomOffset = (Math.random() - 0.5) * 50

      // Get display label from properties or use ID
      const displayLabel = node.properties?.name ||
                          node.properties?.display_name ||
                          node.properties?.label ||
                          node.id

      graph.addNode(node.id, {
        label: displayLabel,
        x: Math.cos(angle) * radius + randomOffset,
        y: Math.sin(angle) * radius + randomOffset,
        size: node.type === 'Patient' ? 20 : node.type === 'SourceDocument' ? 16 : 12,
        color: getNodeColor(node.type),
        properties: { ...node.properties, nodeType: node.type }
      })
    })

    // Add edges
    uploadData.relationships.forEach((relationship) => {
      if (graph.hasNode(relationship.source) && graph.hasNode(relationship.target)) {
        graph.addEdge(relationship.source, relationship.target, {
          id: relationship.id,
          label: relationship.type,
          relationshipType: relationship.type,
          size: 2,
          color: getEdgeColor(relationship.type),
          properties: relationship.properties
        })
      }
    })

    return graph
  }

  const setupEventHandlers = (graph: MultiGraph) => {
    if (!sigmaRef.current) return

    // Add hover and click events for tooltip
    sigmaRef.current.on("enterNode", (event: any) => {
      const node = graph.getNodeAttributes(event.node)
      if (!tooltipPinned) {
        showTooltip(event.node, node, false)
      }
    })

    sigmaRef.current.on("leaveNode", (event: any) => {
      // Clear any existing timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }

      // Only hide tooltip on node leave if it's not pinned
      if (!tooltipPinnedRef.current) {
        leaveTimeoutRef.current = setTimeout(() => {
          if (!tooltipPinnedRef.current && !hoveringTooltipRef.current) {
            hideTooltip()
          }
        }, 150)
      }
    })

    sigmaRef.current.on("clickNode", (event: any) => {
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

    // Add edge hover effects
    sigmaRef.current.on("enterEdge", (event: any) => {
      const edge = graph.getEdgeAttributes(event.edge)
      graph.setEdgeAttribute(event.edge, "originalSize", edge.size || 2)
      graph.setEdgeAttribute(event.edge, "size", 4)
      graph.setEdgeAttribute(event.edge, "highlighted", true)
      requestAnimationFrame(() => {
        sigmaRef.current?.refresh()
      })
    })

    sigmaRef.current.on("leaveEdge", (event: any) => {
      const edge = graph.getEdgeAttributes(event.edge)
      graph.setEdgeAttribute(event.edge, "size", edge.originalSize || 2)
      graph.setEdgeAttribute(event.edge, "highlighted", false)
      requestAnimationFrame(() => {
        sigmaRef.current?.refresh()
      })
    })
  }

  const initializeGraph = async (): Promise<void> => {
    if (!vizRef.current || !data) return

    try {
      setLoading(true)
      setError(null)

      // Load Sigma dynamically
      const Sigma = await loadSigma()
      if (!Sigma) return

      // Clean up any existing instance
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }

      // Clear the container
      if (vizRef.current) {
        vizRef.current.innerHTML = ''
      }

      const graph = createGraphFromUploadData(data)
      graphRef.current = graph

      if (!vizRef.current) return

      sigmaRef.current = new Sigma(graph, vizRef.current, {
        renderEdgeLabels: true,
        defaultNodeColor: "#6b7280",
        labelColor: { color: "#374151" },
        labelSize: 10,
        labelWeight: "600",
        edgeLabelColor: { color: "#1f2937" },
        edgeLabelSize: 12,
        edgeLabelWeight: "600",
        edgeLabelFont: "Inter, Arial, sans-serif",
        allowInvalidContainer: false,
        hideLabelsOnMove: true,
        hideEdgesOnMove: true,
        labelGridCellSize: 100,
        labelDensity: 1,
        zIndex: true
      })

      // Add event handlers
      setupEventHandlers(graph)

      // Update container rect for tooltip positioning
      if (vizRef.current) {
        setContainerRect(vizRef.current.getBoundingClientRect())
      }

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

  const showTooltip = (nodeId: string, nodeAttributes: any, pinned: boolean): void => {
    if (!sigmaRef.current || !vizRef.current) return

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
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    setTooltipVisible(false)
    setTooltipPinned(false)
    setHoveringTooltip(false)

    tooltipPinnedRef.current = false
    hoveringTooltipRef.current = false

    setTimeout(() => {
      setTooltipData(null)
    }, 200)
  }

  const handleTooltipMouseEnter = (): void => {
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

    if (!tooltipPinnedRef.current) {
      leaveTimeoutRef.current = setTimeout(() => {
        if (!tooltipPinnedRef.current && !hoveringTooltipRef.current) {
          hideTooltip()
        }
      }, 100)
    }
  }

  useEffect(() => {
    if (data && vizRef.current) {
      const rect = vizRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        initializeGraph()
      }
    }
  }, [data])

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
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }
    }
  }, [])

  // Update tooltip position on camera changes
  useEffect(() => {
    if (!sigmaRef.current) return

    const handleCameraUpdate = () => {
      if (tooltipVisible && tooltipData && !tooltipPinned && tooltipData.graphX !== undefined && tooltipData.graphY !== undefined) {
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

  const stats = {
    nodes: data?.nodes?.length || 0,
    edges: data?.relationships?.length || 0
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Document Graph: {fileName}
            {!loading && (
              <span className="text-sm text-muted-foreground font-normal">
                ({stats.nodes} nodes, {stats.edges} edges)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualization of entities and relationships extracted from document ID: {documentId}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="relative h-full bg-muted rounded-lg border-2 border-dashed border-border">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading document graph...</div>
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

          {/* Node Tooltip - Simplified without cohort features */}
          <NodeTooltip
            data={tooltipData}
            visible={tooltipVisible}
            pinned={tooltipPinned}
            containerRect={containerRect || undefined}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onBeginTraversal={() => {}} // Disabled for upload graph
            onStopTraversal={() => {}} // Disabled for upload graph
            traversalActive={false}
            isTraversalCenter={false}
            onAddPatient={() => {}} // Disabled for upload graph
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
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#a855f7" }}></div>
                <span>Test Results</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#06b6d4" }}></div>
                <span>Medications</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#9ca3af" }}></div>
                <span>Source Documents</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#84cc16" }}></div>
                <span>Assertions</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Document-specific graph visualization</span>
          <span>Click nodes for details • Drag to pan • Scroll to zoom</span>
        </div>
      </CardContent>
    </Card>
  )
}