import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { ActionModel } from "@/models/Action"

export async function GET(request: Request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)
    const type = searchParams.get("type") || undefined
    const q = searchParams.get("q") || undefined

    const filter: any = {}
    if (type) filter.type = type
    if (q) {
      filter.$or = [
        { summary: { $regex: q, $options: "i" } },
        { doctor: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
      ]
    }

    const docs = await ActionModel.find(filter).sort({ createdAt: -1 }).limit(limit)

    return NextResponse.json({ actions: docs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch actions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()

    const body = await request.json()
    const {
      type = "search",
      summary,
      doctor = "Anonymous",
      query,
      status = "completed",
      resultSummary,
      durationMs,
      details,
      conversationId,
      title,
      timestamp,
    } = body || {}

    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "summary is required" }, { status: 400 })
    }

    const doc = await ActionModel.create({
      type,
      title: title || (type ? `${type[0].toUpperCase()}${type.slice(1)} Action` : "Action"),
      summary: summary.slice(0, 200),
      doctor,
      query,
      status,
      resultSummary,
      durationMs,
      details,
      conversationId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    })

    return NextResponse.json({ action: doc }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create action" }, { status: 500 })
  }
}

