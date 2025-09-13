import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename } = body

    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      )
    }

    // Extract file extension from filename
    const fileExtension = filename.split('.').pop()
    console.log('File extension:', fileExtension)
    console.log('Filename:', filename)

    // Generate unique key for the file


    // Call the external API to get presigned URL
    const response = await fetch('https://api.solyd.serve.cx/api/ingest/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: '.' + fileExtension,
        contentType: 'application/octet-stream'
      })
    })

    if (!response.ok) {
      throw new Error(`External API returned ${response.status}`)
    }

    const presignedData = await response.json()
    return NextResponse.json(presignedData)

  } catch (error: any) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}