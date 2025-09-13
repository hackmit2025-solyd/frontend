"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, MessageSquare, Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface QueryTranslationProps {
  naturalLanguage: string
  cypherQuery: string
}

export function QueryTranslation({ naturalLanguage, cypherQuery }: QueryTranslationProps) {
  const [showQuery, setShowQuery] = useState(false)

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Query Translation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Cypher Query Generated</Badge>
            <Button variant="outline" size="sm" onClick={() => setShowQuery(!showQuery)}>
              {showQuery ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showQuery ? "Hide" : "Show"} Query
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Natural Language Input
            </h4>
            <p className="text-sm bg-muted p-3 rounded border text-pretty">{naturalLanguage}</p>
          </div>

          {showQuery && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Generated Cypher Query
              </h4>
              <div className="relative">
                <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto font-mono">
                  <code>{cypherQuery}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => navigator.clipboard.writeText(cypherQuery)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
