import { NextResponse } from "next/server"
// Increase function timeout for hosted platforms (e.g., Vercel)
export const maxDuration = 300 // seconds

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          detail: [
            {
              loc: ["body", "file"],
              msg: "field required",
              type: "value_error.missing"
            }
          ]
        },
        { status: 422 }
      )
    }

    // Create FormData for the external API
    const externalFormData = new FormData()
    externalFormData.append('file', file, file.name)

    // Create timeout controller (5 minutes to allow OCR/LLM pipelines)
    const controller = new AbortController()
    const timeoutMs = 300_000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Forward request to the real API
      const response = await fetch('https://api.solyd.serve.cx/api/ingest/pdf', {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: externalFormData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        console.log('PDF ingest successful:', result)
        return NextResponse.json(result)
      } else {
        const error = await response.json()
        console.error('PDF ingest failed:', error)
        return NextResponse.json(error, { status: response.status })
      }

    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            detail: [
              {
                loc: ["request"],
                msg: `Request timeout after ${Math.floor(timeoutMs / 1000)} seconds`,
                type: "timeout_error"
              }
            ]
          },
          { status: 408 }
        )
      }

      throw error // Re-throw other errors to be caught by outer catch
    }

  } catch (error: any) {
    console.error('PDF ingest error:', error)
    return NextResponse.json(
      {
        detail: [
          {
            loc: ["body"],
            msg: "Internal server error during PDF processing",
            type: "internal_error"
          }
        ]
      },
      { status: 500 }
    )
  }
}
