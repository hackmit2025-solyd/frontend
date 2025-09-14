import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, limit = 50 } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    // Make the request to the external API
    const response = await fetch('https://api.solyd.serve.cx/api/search/query-graph', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('External API error:', errorText)
      return NextResponse.json(
        { error: 'External API error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Query Graph API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}