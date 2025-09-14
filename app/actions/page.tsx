"use client"

import { useState } from "react"
import { Search, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ActionHistory } from "@/components/action-history"
import { TopNavBar } from "@/components/top-nav-bar"

export default function ActionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  // Filters removed for now; search acts as the filter

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <TopNavBar />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-balance">Actions History</h2>
            <p className="text-muted-foreground">Track all executed queries, voice interactions, and system actions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search actions, queries, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>


        {/* Stats Overview removed per request */}

        {/* Action History */}
        <ActionHistory searchQuery={searchQuery} />
      </div>
    </div>
  )
}
