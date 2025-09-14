'use client'

import { useState, useEffect } from 'react'
import { Query, QuerySubagent, getLastThreeQueries, getSubagentsForQuery } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Clock, AlertCircle, Play } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface QueryWithSubagents extends Query {
  subagents: QuerySubagent[]
}

const parseAgentStatus = (state: any) => {
  if (!state) return { status: 'waiting', message: 'Waiting to start...' }

  // Check for completion states
  if (state.complete || state.finished || state.done || state.success) {
    return {
      status: 'complete',
      message: state.result || state.output || state.message || 'Task completed successfully'
    }
  }

  // Check for error states
  if (state.error || state.failed || state.exception) {
    return {
      status: 'failed',
      message: state.error || state.exception || state.message || 'Task failed'
    }
  }

  // Check for active/running states
  if (state.active || state.running || state.processing || state.working) {
    return {
      status: 'processing',
      message: state.current_action || state.status || state.message || state.step || 'Processing...'
    }
  }

  // Default to waiting with any available message
  return {
    status: 'waiting',
    message: state.message || state.status || state.description || 'Ready to start'
  }
}

const StatusIcon = ({ state }: { state: any }) => {
  const { status } = parseAgentStatus(state)

  switch (status) {
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
    case 'complete':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'waiting':
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const QueryIcon = ({ state }: { state: string }) => {
  switch (state) {
    case 'in_progress':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case 'pending':
    default:
      return <Play className="h-5 w-5 text-yellow-500" />
  }
}

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

const SubagentCard = ({ subagent }: { subagent: QuerySubagent }) => {
  const { status, message } = parseAgentStatus(subagent.state)

  return (
    <div className="ml-4 pl-4 border-l-2 border-gray-200 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon state={subagent.state} />
          <span className="font-medium text-sm">{subagent.agent_name}</span>
        </div>
        <Badge variant={status === 'complete' ? 'default' : 'secondary'} className="text-xs">
          {status === 'processing' && '⟳ Processing...'}
          {status === 'complete' && '✓ Complete'}
          {status === 'failed' && '✗ Failed'}
          {status === 'waiting' && '⏸ Waiting'}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mt-1 italic">"{message}"</p>

      {/* Debug info - remove in production */}
      <details className="mt-2">
        <summary className="text-xs text-gray-400 cursor-pointer">Raw State</summary>
        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
          {JSON.stringify(subagent.state, null, 2)}
        </pre>
      </details>
    </div>
  )
}

const QueryCard = ({ query }: { query: QueryWithSubagents }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <QueryIcon state={query.state} />
            <span>Query #{query.id}</span>
            <Badge variant={query.state === 'completed' ? 'default' : 'secondary'}>
              {query.state.replace('_', ' ')}
            </Badge>
          </CardTitle>
          <span className="text-sm text-gray-500">
            {formatTimeAgo(query.updated_at)}
          </span>
        </div>
        {query.query_text && (
          <p className="text-sm text-gray-600 mt-2">{query.query_text}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {query.subagents.map((subagent) => (
          <SubagentCard key={subagent.id} subagent={subagent} />
        ))}
      </CardContent>
    </Card>
  )
}

export function ActivitiesBar() {
  const [queries, setQueries] = useState<QueryWithSubagents[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchQueriesAndSubagents = async () => {
    try {
      const queriesData = await getLastThreeQueries()

      const queriesWithSubagents = await Promise.all(
        queriesData.map(async (query) => {
          const subagents = await getSubagentsForQuery(query.id)
          return { ...query, subagents }
        })
      )

      // Only update state if data actually changed
      const hasChanged = JSON.stringify(queriesWithSubagents) !== JSON.stringify(queries)
      if (hasChanged) {
        setQueries(queriesWithSubagents)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchQueriesAndSubagents()

    // Poll every 2 seconds
    const interval = setInterval(fetchQueriesAndSubagents, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Activities</h2>
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        {queries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activities</p>
          </div>
        ) : (
          queries.map((query) => (
            <QueryCard key={query.id} query={query} />
          ))
        )}
      </ScrollArea>
    </div>
  )
}