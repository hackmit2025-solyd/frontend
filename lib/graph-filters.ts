import { MultiGraph } from "graphology"

export interface NodeFilter {
  nodeTypes: string[]
  showAll: boolean
}

export interface EdgeFilter {
  relationshipTypes: string[]
  showAll: boolean
}

export interface GraphFilters {
  nodes: NodeFilter
  edges: EdgeFilter
}

export const NODE_TYPES = [
  "Patient",
  "Clinician",
  "Encounter",
  "Symptom",
  "Disease",
  "Test",
  "TestResult",
  "Medication",
  "Procedure",
  "Unknown"
] as const

export type NodeType = typeof NODE_TYPES[number]

export const getNodeTypes = (graph: MultiGraph): string[] => {
  const types = new Set<string>()
  graph.forEachNode((_, attributes) => {
    if (attributes.properties?.nodeType) {
      types.add(attributes.properties.nodeType)
    }
  })
  return Array.from(types).sort()
}

export const getRelationshipTypes = (graph: MultiGraph): string[] => {
  const types = new Set<string>()
  graph.forEachEdge((_, attributes) => {
    if (attributes.label) {
      types.add(attributes.label)
    }
  })
  return Array.from(types).sort()
}

export const filterGraph = (graph: MultiGraph, filters: GraphFilters): void => {
  // Filter nodes - use size 0 to hide nodes instead of hidden attribute
  graph.forEachNode((nodeKey, attributes) => {
    const nodeType = attributes.properties?.nodeType
    const shouldShowNode = filters.nodes.showAll ||
      (nodeType && filters.nodes.nodeTypes.includes(nodeType))

    if (!shouldShowNode) {
      graph.setNodeAttribute(nodeKey, 'size', 0)
      graph.setNodeAttribute(nodeKey, 'hidden', true)
    } else {
      // Restore original size based on node type
      const originalSize = nodeType === 'Patient' ? 20 : nodeType === 'Clinician' ? 18 : 12
      graph.setNodeAttribute(nodeKey, 'size', originalSize)
      graph.removeNodeAttribute(nodeKey, 'hidden')
    }
  })

  // Filter edges - use color transparency to hide edges
  graph.forEachEdge((edgeKey, attributes) => {
    const edgeType = attributes.label
    const shouldShowEdge = filters.edges.showAll ||
      (edgeType && filters.edges.relationshipTypes.includes(edgeType))

    // Also hide edges if either source or target node is hidden
    const sourceHidden = graph.getNodeAttribute(graph.source(edgeKey), 'hidden')
    const targetHidden = graph.getNodeAttribute(graph.target(edgeKey), 'hidden')

    if (!shouldShowEdge || sourceHidden || targetHidden) {
      graph.setEdgeAttribute(edgeKey, 'color', 'transparent')
      graph.setEdgeAttribute(edgeKey, 'hidden', true)
    } else {
      graph.setEdgeAttribute(edgeKey, 'color', '#94a3b8')
      graph.removeEdgeAttribute(edgeKey, 'hidden')
    }
  })
}

export const createDefaultFilters = (): GraphFilters => ({
  nodes: {
    nodeTypes: [...NODE_TYPES],
    showAll: true
  },
  edges: {
    relationshipTypes: [],
    showAll: true
  }
})

export const getVisibleNodeCount = (graph: MultiGraph): number => {
  let count = 0
  graph.forEachNode((_, attributes) => {
    if (!attributes.hidden) {
      count++
    }
  })
  return count
}

export const getVisibleEdgeCount = (graph: MultiGraph): number => {
  let count = 0
  graph.forEachEdge((_, attributes) => {
    if (!attributes.hidden) {
      count++
    }
  })
  return count
}