import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react"

export function GraphVisualization() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Patient Network Graph
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm">
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Interactive visualization of patient relationships and care networks
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
          {/* Simulated Graph Visualization */}
          <div className="absolute inset-4 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 400 300" className="text-foreground">
              {/* Connections */}
              <line x1="100" y1="150" x2="200" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <line x1="100" y1="150" x2="200" y2="200" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <line x1="200" y1="100" x2="300" y2="150" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <line x1="200" y1="200" x2="300" y2="150" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <line x1="200" y1="100" x2="200" y2="200" stroke="currentColor" strokeWidth="2" opacity="0.6" />

              {/* Patient Nodes */}
              <circle cx="100" cy="150" r="20" fill="hsl(var(--primary))" />
              <text x="100" y="155" textAnchor="middle" className="text-xs fill-white font-semibold">
                P1
              </text>

              <circle cx="200" cy="100" r="20" fill="hsl(var(--primary))" />
              <text x="200" y="105" textAnchor="middle" className="text-xs fill-white font-semibold">
                P2
              </text>

              <circle cx="200" cy="200" r="20" fill="hsl(var(--primary))" />
              <text x="200" y="205" textAnchor="middle" className="text-xs fill-white font-semibold">
                P3
              </text>

              {/* Provider Node */}
              <circle cx="300" cy="150" r="25" fill="hsl(var(--secondary))" />
              <text x="300" y="155" textAnchor="middle" className="text-xs fill-white font-semibold">
                Dr.S
              </text>

              {/* Policy Node */}
              <rect x="50" y="50" width="40" height="20" fill="hsl(var(--accent))" rx="4" />
              <text x="70" y="63" textAnchor="middle" className="text-xs fill-white font-semibold">
                Pol X
              </text>

              {/* Encounter Nodes */}
              <rect x="150" y="40" width="30" height="15" fill="hsl(var(--chart-3))" rx="2" />
              <text x="165" y="50" textAnchor="middle" className="text-xs fill-white">
                Enc
              </text>

              <rect x="150" y="245" width="30" height="15" fill="hsl(var(--chart-3))" rx="2" />
              <text x="165" y="255" textAnchor="middle" className="text-xs fill-white">
                Enc
              </text>

              {/* Connection lines for policy and encounters */}
              <line
                x1="90"
                y1="60"
                x2="100"
                y2="130"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="3,3"
              />
              <line
                x1="165"
                y1="55"
                x2="200"
                y2="80"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="3,3"
              />
              <line
                x1="165"
                y1="245"
                x2="200"
                y2="220"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="3,3"
              />
            </svg>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background border border-border rounded p-3 space-y-2">
            <h4 className="font-semibold text-sm">Legend</h4>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-primary"></div>
              <span>Patients</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-secondary"></div>
              <span>Providers</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-accent"></div>
              <span>Policies</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-chart-3"></div>
              <span>Encounters</span>
            </div>
          </div>

          {/* Node Info Panel */}
          <div className="absolute top-4 right-4 bg-background border border-border rounded p-3 min-w-48">
            <h4 className="font-semibold text-sm mb-2">Selected: Sarah Johnson</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Node Type:</span>
                <Badge variant="secondary" className="text-xs">
                  Patient
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span>4</span>
              </div>
              <div className="flex justify-between">
                <span>Last Activity:</span>
                <span>Jan 15, 2024</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing 3 patients, 1 provider, 1 policy, 2 encounters</span>
          <span>Click nodes for details • Drag to pan • Scroll to zoom</span>
        </div>
      </CardContent>
    </Card>
  )
}
