import { Schema, model, models } from "mongoose"

const ActionSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, default: "" },
    summary: { type: String, required: true, maxlength: 200 },
    doctor: { type: String, default: "Anonymous" },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: "completed" },
    durationMs: { type: Number },
    resultSummary: { type: String },
    query: { type: String },
    details: { type: Schema.Types.Mixed },
    conversationId: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
)

export const ActionModel = models.Action || model("Action", ActionSchema)

