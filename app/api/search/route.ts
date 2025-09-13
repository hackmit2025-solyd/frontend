import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, query_id } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    if (!query_id || typeof query_id !== "string") {
      return NextResponse.json({ error: "query_id is required" }, { status: 400 })
    }

    // TODO: Replace this with your actual backend server URL
    const backendUrl = process.env.BACKEND_SERVER_URL || 'http://localhost:8000'

    // Forward the request to your backend server
    const response = await fetch(`${backendUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        query_id,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend server error:', errorText)
      return NextResponse.json(
        { error: 'Backend server error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}