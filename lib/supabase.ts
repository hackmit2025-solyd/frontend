import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Query {
  id: number
  uuid: string
  state: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  query_text?: string
}

export interface QuerySubagent {
  id: number
  query_id: number
  agent_name: string
  state: any // Raw JSONB state from LLM
  created_at: string
  updated_at: string
}

export async function getLastThreeQueries(): Promise<Query[]> {
  const { data, error } = await supabase
    .from('queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching queries:', error)
    return []
  }

  return data || []
}

export async function getSubagentsForQuery(queryId: number): Promise<QuerySubagent[]> {
  const { data, error } = await supabase
    .from('query_subagent')
    .select('*')
    .eq('query_id', queryId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching subagents:', error)
    return []
  }

  return data || []
}

export async function submitQuery(uuid: string, queryText: string): Promise<Query | null> {
  const { data, error } = await supabase
    .from('queries')
    .insert([
      {
        uuid,
        query_text: queryText,
        state: 'pending'
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error submitting query:', error)
    return null
  }

  return data
}