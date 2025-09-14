"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface NodeTooltipData {
  id: string
  label: string
  nodeType: string
  properties: Record<string, any>
  x: number
  y: number
  graphX?: number
  graphY?: number
}

interface NodeTooltipProps {
  data: NodeTooltipData | null
  visible: boolean
  pinned: boolean
  containerRect?: DOMRect
}

const formatPropertyValue = (key: string, value: any): string => {
  if (value === null || value === undefined) {
    return "N/A"
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  if (typeof value === "string" && value.length > 50) {
    return value.substring(0, 50) + "..."
  }

  return String(value)
}

const formatPropertyKey = (key: string): string => {
  return key
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function NodeTooltip({ data, visible, pinned, containerRect }: NodeTooltipProps) {
  if (!visible || !data) {
    return null
  }

  // Calculate tooltip position
  let tooltipX = data.x + 20 // Offset to the right of the node
  let tooltipY = data.y - 10 // Slightly above the node

  // Ensure tooltip stays within container bounds
  if (containerRect) {
    const tooltipWidth = 280 // Approximate tooltip width
    const tooltipHeight = 200 // Approximate tooltip height

    if (tooltipX + tooltipWidth > containerRect.width) {
      tooltipX = data.x - tooltipWidth - 20 // Position to the left instead
    }

    if (tooltipY + tooltipHeight > containerRect.height) {
      tooltipY = data.y - tooltipHeight + 10 // Position above instead
    }

    if (tooltipX < 0) tooltipX = 10
    if (tooltipY < 0) tooltipY = 10
  }

  // Filter out internal properties and nodeType since we show it separately
  const displayProperties = Object.entries(data.properties || {})
    .filter(([key]) => key !== 'nodeType')
    .slice(0, 8) // Limit to prevent tooltip from being too large

  return (
    <div
      className={`absolute z-50 pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: tooltipX,
        top: tooltipY,
        transform: 'translate(0, 0)',
      }}
    >
      <Card className="w-72 shadow-lg border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate">
              {data.label || data.id}
            </CardTitle>
            <Badge variant="secondary" className="ml-2 text-xs">
              {data.nodeType}
            </Badge>
          </div>
          {pinned && (
            <div className="text-xs text-muted-foreground">
              Pinned (click elsewhere to unpin)
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-muted-foreground">ID:</span>
              <span className="ml-2 font-mono text-xs break-all">{data.id}</span>
            </div>

            {displayProperties.length > 0 && (
              <div className="border-t pt-2">
                <div className="font-medium text-muted-foreground mb-2">Properties:</div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {displayProperties.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {formatPropertyKey(key)}:
                      </span>
                      <span className="text-muted-foreground ml-2 break-words text-xs">
                        {formatPropertyValue(key, value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(data.properties || {}).length > displayProperties.length && (
              <div className="text-muted-foreground italic">
                +{Object.keys(data.properties || {}).length - displayProperties.length} more properties...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}