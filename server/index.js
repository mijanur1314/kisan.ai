import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import { Queue } from "bullmq";
import OpenAI from "openai";

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";

import Chat from "./models/Chat.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(() => process.exit(1));

app.use("/auth", authRoutes);
app.get("/", (_, res) => res.json({ status: "OK" }));

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files allowed"));
    } else {
      cb(null, true);
    }
  },
});

const queue = new Queue("file-upload-queue", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
  },
});

const a4fClient = new OpenAI({
  apiKey: process.env.A4F_API_KEY,
  baseURL: "https://api.a4f.co/v1",
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL || "http://localhost:6333",
  collectionName: "langchainjs-testing",
});

const retriever = vectorStore.asRetriever({ k: 3 });

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }

    await queue.add("file-ready", {
      filename: req.file.originalname,
      path: req.file.path,
    });

    res.json({ message: "PDF uploaded" });
  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user?.id;

    if (!message || !chatId || !userId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const chat =
      (await Chat.findOne({ chatId, userId })) ||
      (await Chat.create({ chatId, userId, messages: [] }));

    chat.messages.push({ role: "user", content: message });
    await chat.save();

    const docs = await retriever.invoke(message);

    if (!docs || docs.length === 0) {
      const fallback = "I don't know based on the provided documents.";
      chat.messages.push({ role: "assistant", content: fallback, sources: [] });
      await chat.save();
      return res.json({ message: fallback, sources: [] });
    }

    const context = docs
      .map((d, i) => `Source ${i + 1}:\n${d.pageContent}`)
      .join("\n\n");

    const SYSTEM_PROMPT = `
You are an expert Agriculture Assistant.

Your domain is strictly agriculture:
- Crops
- Soil
- Irrigation
- Pests and diseases
- Farming practices
- Sustainable agriculture

Rules:
- Answer ONLY using the context below.
- Do NOT use outside knowledge.
- If the answer is not in the context, say:
  "I don't know based on the provided documents."
- Keep answers concise and farmer-friendly.

Context:
${context}
`;

    let answer = "I don't know based on the provided documents.";

    try {
      const aiRes = await a4fClient.chat.completions.create({
        model: "provider-8/gemini-2.0-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      answer = aiRes?.choices?.[0]?.message?.content || answer;
    } catch {}

    chat.messages.push({
      role: "assistant",
      content: answer,
      sources: docs.map((d) => ({
        preview: d.pageContent.slice(0, 200),
        metadata: d.metadata,
      })),
    });

    await chat.save();

    res.json({
      message: answer,
      sources: docs.map((d) => ({
        preview: d.pageContent.slice(0, 200),
        metadata: d.metadata,
      })),
    });
  } catch {
    res.status(500).json({ error: "Chat failed" });
  }
});

app.get("/chat/history/:chatId", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      chatId: req.params.chatId,
      userId: req.user?.id,
    });

    res.json(chat || { messages: [] });
  } catch {
    res.status(500).json({ error: "History failed" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "PDF too large. Max size is 200MB." });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
