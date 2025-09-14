import { NextResponse } from "next/server"

// Function to obscure sensitive patient data for HIPAA compliance
function obscurePatientData(data: any, hipaa: boolean) {
  if (!hipaa || !data) return data

  // Create a deep copy to avoid mutating the original data
  const obscuredData = JSON.parse(JSON.stringify(data))

  // Process nodes array if it exists
  if (obscuredData.nodes && Array.isArray(obscuredData.nodes)) {
    obscuredData.nodes = obscuredData.nodes.map((node: any) => {
      // Check if this appears to be a patient node
      const isPatientNode = node.type === 'patient' ||
                           node.label === 'Patient' ||
                           (node.name && (node.dob || node.birth_date || node.birthdate))

      if (isPatientNode) {
        // Obscure patient name
        if (node.name) {
          node.name = '[Patient Name Protected]'
        }

        // Obscure date of birth variations
        if (node.dob) {
          node.dob = '[Protected]'
        }
        if (node.birth_date) {
          node.birth_date = '[Protected]'
        }
        if (node.birthdate) {
          node.birthdate = '[Protected]'
        }

        // Also check properties object if it exists
        if (node.properties) {
          if (node.properties.name) {
            node.properties.name = '[Patient Name Protected]'
          }
          if (node.properties.dob) {
            node.properties.dob = '[Protected]'
          }
          if (node.properties.birth_date) {
            node.properties.birth_date = '[Protected]'
          }
          if (node.properties.birthdate) {
            node.properties.birthdate = '[Protected]'
          }
        }
      }

      return node
    })
  }

  return obscuredData
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, limit = 50 } = body

    // Get hipaa from query parameters
    const { searchParams } = new URL(request.url)
    const hipaaParam = searchParams.get('hipaa')
    const hipaa = hipaaParam === 'true'

    // Log the HIPAA state being used
    console.log('Query Graph API - HIPAA state received:', {
      queryParam: hipaaParam,
      processedHipaa: hipaa,
      type: typeof hipaaParam
    })

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    // Log the query string being constructed
    const queryBody = {
      query,
      limit,
      hipaa: Boolean(hipaa),
    }
    console.log('Query Graph API - Sending request with body:', JSON.stringify(queryBody, null, 2))

    // Make the request to the external API
    const response = await fetch(`https://api.solyd.serve.cx/api/search/query-graph?hipaa=${hipaa}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
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

    // Log the successful response
    console.log('Query Graph API - Response received:', {
      status: response.status,
      dataKeys: Object.keys(data),
      recordCount: Array.isArray(data.data) ? data.data.length : 'N/A',
      query,
      hipaa
    })

    // Loop through nodes and check for names
    if (data.nodes && Array.isArray(data.nodes)) {
      console.log(`Query Graph API - Found ${data.nodes.length} nodes:`)
      data.nodes.forEach((node, index) => {
        console.log(`Node ${index}:`, {
          id: node.id || 'No ID',
          name: node.name || 'No name',
          hasName: !!node.name,
          allKeys: Object.keys(node)
        })
      })
    } else {
      console.log('Query Graph API - No nodes array found in response')
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Query Graph API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}