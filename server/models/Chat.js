import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        preview: String,
        metadata: Object,
      },
    ],
  },
  { timestamps: true }
);

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ChatSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export default mongoose.model("Chat", ChatSchema);
