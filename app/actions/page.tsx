"use client"

import { useState } from "react"
import { Search, Filter, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ActionHistory } from "@/components/action-history"
import { ActionFilters } from "@/components/action-filters"
import { ActionStats } from "@/components/action-stats"
import { TopNavBar } from "@/components/top-nav-bar"

export default function ActionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

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

        {/* Search and Filters */}
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && <ActionFilters />}

        {/* Stats Overview */}
        <ActionStats />

        {/* Action History */}
        <ActionHistory searchQuery={searchQuery} />
      </div>
    </div>
  )
}
