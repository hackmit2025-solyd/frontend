"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, ZoomIn, ZoomOut, RotateCcw, Filter, Eye, EyeOff } from "lucide-react"
import { MultiGraph } from "graphology"
import { GraphFilters } from "@/components/graph-filters"
import { NodeTooltip, NodeTooltipData } from "@/components/node-tooltip"
import { useCohort, type CohortPatient } from "@/components/cohort-provider"
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

// Function to get edge color based on type
const getEdgeColor = (type: string): string => {
  return EDGE_COLOR_MAP[type] || EDGE_COLOR_MAP.default
}

interface GraphVisualizationProps {
  data?: ApiResponse
  filters?: GraphFiltersType
  availableNodeTypes?: string[]
  availableRelationshipTypes?: string[]
  filtersOpen?: boolean
  onFiltersChange?: (filters: GraphFiltersType) => void
  onAvailableNodeTypesChange?: (nodeTypes: string[]) => void
  onAvailableRelationshipTypesChange?: (relationshipTypes: string[]) => void
  onFiltersOpenChange?: (open: boolean) => void
  onNodeTypesChange?: (nodeTypes: string[]) => void
  onShowAllNodesChange?: (showAll: boolean) => void
  onRelationshipTypesChange?: (relationshipTypes: string[]) => void
  onShowAllRelationshipsChange?: (showAll: boolean) => void
}

export function GraphVisualization({
  data,
  filters: propsFilters,
  availableNodeTypes: propsAvailableNodeTypes,
  availableRelationshipTypes: propsAvailableRelationshipTypes,
  filtersOpen: propsFiltersOpen,
  onFiltersChange,
  onAvailableNodeTypesChange,
  onAvailableRelationshipTypesChange,
  onFiltersOpenChange,
  onNodeTypesChange,
  onShowAllNodesChange,
  onRelationshipTypesChange,
  onShowAllRelationshipsChange,
}: GraphVisualizationProps) {
  const vizRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<any>(null)
  const graphRef = useRef<MultiGraph | null>(null)
  const tooltipPinnedRef = useRef<boolean>(false)
  const hoveringTooltipRef = useRef<boolean>(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addPatient } = useCohort()
  const [sigmaLoaded, setSigmaLoaded] = useState(false)

  // Use props if provided, otherwise use local state
  const [localFilters, setLocalFilters] = useState<GraphFiltersType>(createDefaultFilters())
  const [localAvailableNodeTypes, setLocalAvailableNodeTypes] = useState<string[]>([])
  const [localAvailableRelationshipTypes, setLocalAvailableRelationshipTypes] = useState<string[]>([])
  const [localFiltersOpen, setLocalFiltersOpen] = useState(false)

  const filters = propsFilters ?? localFilters
  const availableNodeTypes = propsAvailableNodeTypes ?? localAvailableNodeTypes
  const availableRelationshipTypes = propsAvailableRelationshipTypes ?? localAvailableRelationshipTypes
  const filtersOpen = propsFiltersOpen ?? localFiltersOpen

  const setFilters = onFiltersChange ?? setLocalFilters
  const setAvailableNodeTypes = onAvailableNodeTypesChange ?? setLocalAvailableNodeTypes
  const setAvailableRelationshipTypes = onAvailableRelationshipTypesChange ?? setLocalAvailableRelationshipTypes
  const setFiltersOpen = onFiltersOpenChange ?? setLocalFiltersOpen
  const [visibleStats, setVisibleStats] = useState({ nodes: 0, edges: 0 })
  const [legendVisible, setLegendVisible] = useState(true)

  // Edge traversal state
  const [traversalState, setTraversalState] = useState<{
    active: boolean
    centerNodeId: string | null
    degree: number
    revealedNodes: Set<string>
    revealedEdges: Set<string>
  }>({
    active: false,
    centerNodeId: null,
    degree: 1,
    revealedNodes: new Set(),
    revealedEdges: new Set()
  })

  // Store full dataset for traversals
  const fullGraphRef = useRef<MultiGraph | null>(null)
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

  // Traversal algorithm: find nodes within N degrees
  const findNodesWithinDegrees = (centerNodeId: string, degree: number, fullGraph: MultiGraph): { nodes: Set<string>, edges: Set<string> } => {
    if (!fullGraph || !fullGraph.hasNode(centerNodeId)) {
      return { nodes: new Set(), edges: new Set() }
    }

    const visitedNodes = new Set<string>([centerNodeId])
    const connectedEdges = new Set<string>()
    const currentLevel = new Set<string>([centerNodeId])

    // BFS traversal for N degrees
    for (let currentDegree = 0; currentDegree < degree; currentDegree++) {
      const nextLevel = new Set<string>()

      for (const nodeId of currentLevel) {
        // Get all neighbors of current node
        const neighbors = fullGraph.neighbors(nodeId)

        // Get all edges connected to this node
        const nodeEdges = fullGraph.edges(nodeId)

        for (const edge of nodeEdges) {
          const edgeData = fullGraph.getEdgeAttributes(edge)
          // Apply global filters to edges
          if (shouldShowEdgeType(edgeData.relationshipType || edgeData.label || 'default')) {
            connectedEdges.add(edge)

            // Add connected nodes if they pass node filters
            const [source, target] = fullGraph.extremities(edge)
            const targetNode = source === nodeId ? target : source
            const targetData = fullGraph.getNodeAttributes(targetNode)

            if (shouldShowNodeType(targetData.properties?.nodeType || 'Unknown')) {
              visitedNodes.add(targetNode)
              if (currentDegree < degree - 1) {
                nextLevel.add(targetNode)
              }
            }
          }
        }
      }

      currentLevel.clear()
      nextLevel.forEach(node => currentLevel.add(node))
    }

    return { nodes: visitedNodes, edges: connectedEdges }
  }

  // Helper functions to check if node/edge should be shown based on filters
  const shouldShowNodeType = (nodeType: string): boolean => {
    if (filters.nodes.showAll) return true
    return filters.nodes.nodeTypes.includes(nodeType)
  }

  const shouldShowEdgeType = (edgeType: string): boolean => {
    if (filters.edges.showAll) return true
    return filters.edges.relationshipTypes.includes(edgeType)
  }

  // Start edge traversal from a node
  const beginEdgeTraversal = (nodeId: string): void => {
    if (!fullGraphRef.current) return

    const traversalResult = findNodesWithinDegrees(nodeId, 1, fullGraphRef.current)

    setTraversalState({
      active: true,
      centerNodeId: nodeId,
      degree: 1,
      revealedNodes: traversalResult.nodes,
      revealedEdges: traversalResult.edges
    })

    // Apply filters to update reducers with new traversal state
    applyFilters()
  }

  // Stop edge traversal
  const stopEdgeTraversal = (): void => {
    setTraversalState({
      active: false,
      centerNodeId: null,
      degree: 1,
      revealedNodes: new Set(),
      revealedEdges: new Set()
    })

    // Apply filters to update reducers with cleared traversal state
    applyFilters()
  }

  // Check if a node should be visible (considering query filters + traversal)
  const isNodeVisible = (nodeId: string): boolean => {
    if (!graphRef.current) return false

    const nodeData = graphRef.current.getNodeAttributes(nodeId)
    const nodeType = nodeData.properties?.nodeType || 'Unknown'

    // Apply global filters
    if (!shouldShowNodeType(nodeType)) return false

    // If traversal is active, only show nodes in the revealed set or originally visible
    if (traversalState.active) {
      return traversalState.revealedNodes.has(nodeId) || !graphRef.current.hasNode(nodeId)
    }

    return true
  }

  // Check if an edge should be visible (considering query filters + traversal)
  const isEdgeVisible = (edgeId: string): boolean => {
    if (!graphRef.current) return false

    const edgeData = graphRef.current.getEdgeAttributes(edgeId)
    const edgeType = edgeData.relationshipType || edgeData.label || 'default'

    // Apply global filters
    if (!shouldShowEdgeType(edgeType)) return false

    // If traversal is active, only show edges in the revealed set or originally visible
    if (traversalState.active) {
      return traversalState.revealedEdges.has(edgeId) || !graphRef.current.hasEdge(edgeId)
    }

    return true
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

  const updateGraphWithData = async (apiData: ApiResponse) => {
    if (!vizRef.current || !apiData?.nodes || !apiData?.edges) return

    try {
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

      const graph = createGraphFromApiData(apiData)

      // Store full graph for traversals
      const fullGraph = createGraphFromApiData(apiData)
      fullGraphRef.current = fullGraph
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
        labelColor: { color: "#374151" },
        labelSize: 10,
        labelWeight: "600",
        edgeLabelColor: { color: "#1f2937" },
        edgeLabelSize: 12,
        edgeLabelWeight: "600",
        edgeLabelFont: "Inter, Arial, sans-serif",
        // GPU-friendly performance options (type-safe subset)
        allowInvalidContainer: false,
        hideLabelsOnMove: true,
        hideEdgesOnMove: true,
        labelGridCellSize: 100,
        labelDensity: 1,
        zIndex: true
      })

      // Add edge reducer for dynamic edge coloring and visibility
      sigmaRef.current.setSetting('edgeReducer', (edge: string, data: any) => {
        const relationshipType = data.relationshipType || data.label || 'default'
        const baseColor = getEdgeColor(relationshipType)

        // Check if edge should be visible
        const visible = isEdgeVisible(edge)

        // Make edge brighter when highlighted
        const color = data.highlighted ? baseColor + 'FF' : baseColor + '99'

        return {
          ...data,
          color: color,
          hidden: !visible
        }
      })

      // Add node reducer for dynamic visibility and traversal highlighting
      sigmaRef.current.setSetting('nodeReducer', (node: string, data: any) => {
        const visible = isNodeVisible(node)
        const isTraversalCenter = traversalState.active && traversalState.centerNodeId === node
        const isTraversalRevealed = traversalState.active && traversalState.revealedNodes.has(node) && node !== traversalState.centerNodeId

        // Highlight traversal center node
        const size = data.size || 12
        const finalSize = isTraversalCenter ? size * 1.5 : size

        // Add border for traversal-revealed nodes
        const borderColor = isTraversalCenter ? '#ff6b35' : (isTraversalRevealed ? '#4ade80' : undefined)
        const borderWidth = (isTraversalCenter || isTraversalRevealed) ? 3 : 0

        return {
          ...data,
          size: finalSize,
          borderColor: borderColor,
          borderWidth: borderWidth,
          hidden: !visible
        }
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
      // Use a small delay to allow mouse to move to tooltip area
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

    // Add edge hover effects for better highlighting (GPU-optimized)
    sigmaRef.current.on("enterEdge", (event: any) => {
      const edge = graph.getEdgeAttributes(event.edge)
      // Highlight the edge by making it thicker and store original size
      graph.setEdgeAttribute(event.edge, "originalSize", edge.size || 2)
      graph.setEdgeAttribute(event.edge, "size", 4)
      graph.setEdgeAttribute(event.edge, "highlighted", true)
      // Use requestAnimationFrame for smooth GPU rendering
      requestAnimationFrame(() => {
        sigmaRef.current?.refresh()
      })
    })

    sigmaRef.current.on("leaveEdge", (event: any) => {
      const edge = graph.getEdgeAttributes(event.edge)
      // Reset edge to original appearance
      graph.setEdgeAttribute(event.edge, "size", edge.originalSize || 2)
      graph.setEdgeAttribute(event.edge, "highlighted", false)
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

    // Add edges
    apiData.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          id: edge.id,
          label: edge.type,
          relationshipType: edge.type, // Store relationship type for edge reducer
          size: 2,
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

      const apiData = await fetchGraphData()
      const graph = createGraphFromApiData(apiData)

      // Store full graph for traversals
      const fullGraph = createGraphFromApiData(apiData)
      fullGraphRef.current = fullGraph
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
        labelColor: { color: "#374151" },
        labelSize: 10,
        labelWeight: "600",
        edgeLabelColor: { color: "#1f2937" },
        edgeLabelSize: 12,
        edgeLabelWeight: "600",
        edgeLabelFont: "Inter, Arial, sans-serif",
        // GPU-friendly performance options (type-safe subset)
        allowInvalidContainer: false,
        hideLabelsOnMove: true,
        hideEdgesOnMove: true,
        labelGridCellSize: 100,
        labelDensity: 1,
        zIndex: true
      })

      // Add edge reducer for dynamic edge coloring and visibility
      sigmaRef.current.setSetting('edgeReducer', (edge: string, data: any) => {
        const relationshipType = data.relationshipType || data.label || 'default'
        const baseColor = getEdgeColor(relationshipType)

        // Check if edge should be visible
        const visible = isEdgeVisible(edge)

        // Make edge brighter when highlighted
        const color = data.highlighted ? baseColor + 'FF' : baseColor + '99'

        return {
          ...data,
          color: color,
          hidden: !visible
        }
      })

      // Add node reducer for dynamic visibility and traversal highlighting
      sigmaRef.current.setSetting('nodeReducer', (node: string, data: any) => {
        const visible = isNodeVisible(node)
        const isTraversalCenter = traversalState.active && traversalState.centerNodeId === node
        const isTraversalRevealed = traversalState.active && traversalState.revealedNodes.has(node) && node !== traversalState.centerNodeId

        // Highlight traversal center node
        const size = data.size || 12
        const finalSize = isTraversalCenter ? size * 1.5 : size

        // Add border for traversal-revealed nodes
        const borderColor = isTraversalCenter ? '#ff6b35' : (isTraversalRevealed ? '#4ade80' : undefined)
        const borderWidth = (isTraversalCenter || isTraversalRevealed) ? 3 : 0

        return {
          ...data,
          size: finalSize,
          borderColor: borderColor,
          borderWidth: borderWidth,
          hidden: !visible
        }
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

    // Recreate reducers with current filter state
    sigmaRef.current.setSetting('nodeReducer', (node: string, data: any) => {
      const visible = isNodeVisible(node)
      const isTraversalCenter = traversalState.active && traversalState.centerNodeId === node
      const isTraversalRevealed = traversalState.active && traversalState.revealedNodes.has(node) && node !== traversalState.centerNodeId

      // Highlight traversal center node
      const size = data.size || 12
      const finalSize = isTraversalCenter ? size * 1.5 : size

      // Add border for traversal-revealed nodes
      const borderColor = isTraversalCenter ? '#ff6b35' : (isTraversalRevealed ? '#4ade80' : undefined)
      const borderWidth = (isTraversalCenter || isTraversalRevealed) ? 3 : 0

      return {
        ...data,
        size: finalSize,
        borderColor: borderColor,
        borderWidth: borderWidth,
        hidden: !visible
      }
    })

    sigmaRef.current.setSetting('edgeReducer', (edge: string, data: any) => {
      const relationshipType = data.relationshipType || data.label || 'default'
      const baseColor = getEdgeColor(relationshipType)

      // Check if edge should be visible
      const visible = isEdgeVisible(edge)

      // Make edge brighter when highlighted
      const color = data.highlighted ? baseColor + 'FF' : baseColor + '99'

      return {
        ...data,
        color: color,
        hidden: !visible
      }
    })

    sigmaRef.current.refresh()
    updateVisibleStats(graphRef.current)
  }

  const handleNodeTypesChange = (nodeTypes: string[]): void => {
    if (onNodeTypesChange) {
      onNodeTypesChange(nodeTypes)
    } else {
      setLocalFilters((prev: GraphFiltersType) => ({
        ...prev,
        nodes: {
          ...prev.nodes,
          nodeTypes,
          showAll: false
        }
      }))
    }
  }

  const handleShowAllNodesChange = (showAll: boolean): void => {
    if (onShowAllNodesChange) {
      onShowAllNodesChange(showAll)
    } else {
      setLocalFilters((prev: GraphFiltersType) => ({
        ...prev,
        nodes: {
          ...prev.nodes,
          showAll,
          nodeTypes: showAll ? availableNodeTypes : prev.nodes.nodeTypes
        }
      }))
    }
  }

  const handleRelationshipTypesChange = (relationshipTypes: string[]): void => {
    if (onRelationshipTypesChange) {
      onRelationshipTypesChange(relationshipTypes)
    } else {
      setLocalFilters((prev: GraphFiltersType) => ({
        ...prev,
        edges: {
          ...prev.edges,
          relationshipTypes,
          showAll: false
        }
      }))
    }
  }

  const handleShowAllRelationshipsChange = (showAll: boolean): void => {
    if (onShowAllRelationshipsChange) {
      onShowAllRelationshipsChange(showAll)
    } else {
      setLocalFilters((prev: GraphFiltersType) => ({
        ...prev,
        edges: {
          ...prev.edges,
          showAll,
          relationshipTypes: showAll ? availableRelationshipTypes : prev.edges.relationshipTypes
        }
      }))
    }
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

  const handleAddPatient = (node: NodeTooltipData): void => {
    // Build a CohortPatient from node data
    const props = node.properties || {}
    const patient: CohortPatient = {
      id: String(node.id),
      displayName: node.label || String(node.id),
      dob: props.dob || props.date_of_birth || props.birthDate || props.birth_date || undefined,
      sex: props.sex || props.gender || undefined,
      pcp: props.pcp || props.primaryCareProvider || props.provider || undefined,
      policy: props.policy || props.coverage || undefined,
      notes: undefined,
      contactPhone: props.phone || props.contactPhone || undefined,
      contactEmail: props.email || props.contactEmail || undefined,
      properties: props,
    }
    addPatient(patient)
  }

  // Watch for data prop changes
  useEffect(() => {
    if (data && vizRef.current) {
      // Check if the container is actually visible
      const rect = vizRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setLoading(true)
        updateGraphWithData(data).catch(err => {
          console.error('Failed to update graph with data:', err)
          setError('Failed to update graph visualization')
          setLoading(false)
        })
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
            onBeginTraversal={beginEdgeTraversal}
            onStopTraversal={stopEdgeTraversal}
            traversalActive={traversalState.active}
            isTraversalCenter={tooltipData?.id === traversalState.centerNodeId}
            onAddPatient={handleAddPatient}
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
