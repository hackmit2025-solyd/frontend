import { NextResponse } from "next/server"

async function uploadFile(file: File, presignedData: any) {
  const formData = new FormData()

  // Add all the fields from the presigned URL response
  formData.append('Content-Type', presignedData.fields['Content-Type'])
  formData.append('key', presignedData.fields.key)
  formData.append('AWSAccessKeyId', presignedData.fields.AWSAccessKeyId)
  formData.append('policy', presignedData.fields.policy)
  formData.append('signature', presignedData.fields.signature)

  // Add the file LAST (this is important for S3)
  formData.append('file', presignedData.file_key)

  try {
    const response = await fetch(presignedData.url, {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      console.log('Presigned url successful!')
      return { success: true }
    } else {
      console.error('Upload failed:', response.status)
      return { success: false, error: `Upload failed with status ${response.status}` }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Get presigned URL from our presigned endpoint
    const presignedResponse = await fetch(`${request.url.split('/upload')[0]}/upload/presigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name
      })
    })

    if (!presignedResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get presigned URL" },
        { status: 500 }
      )
    }

    const presignedData = await presignedResponse.json()

    // Upload file using the presigned URL
    const uploadResult = await uploadFile(file, presignedData)

    if (uploadResult.success) {
      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        file_key: presignedData.file_key,
        file_uuid: presignedData.file_uuid
      })
    } else {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}