/**
 * AgroSathi - Agriculture Intelligence Platform
 * Main server entry point
 * Initializes Express app, connects to database, and mounts all API routes
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Config & DB
import connectDB from "./config/db.js";
import { imageUploadDir } from "./utils/multer.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import chatRoutes from "./routes/chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Global Middleware or Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (_, res) => res.json({ status: "OK" }));

// Images helper route
app.get("/uploads/images/:filename", (req, res) => {
  const { filename } = req.params;
  const filepath = `${imageUploadDir}/${filename}`;
  import("fs").then(fs => {
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.sendFile(filepath, { root: "." });
  });
});

// App Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);

// Error handling for Multer
import multer from "multer";
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Max size is 10MB for images, 200MB for PDFs." });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  // Server started successfully
});
