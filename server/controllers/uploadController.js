/**
 * Upload Controller
 * Handles PDF file uploads and queue processing
 */

import { uploadQueue } from "../config/queue.js";

/**
 * Handles PDF file upload and adds job to processing queue
 * File is validated and stored via multer middleware before this handler
 * @param {Object} req - Express request object
 * @param {Object} req.file - Uploaded file object from multer
 * @param {string} req.file.originalname - Original filename
 * @param {string} req.file.path - Stored file path
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming upload or error
 */
export const uploadPDF = async (req, res) => {
    try {

        await uploadQueue.add("file-ready", {
            filename: req.file.originalname,
            path: req.file.path,
        });

        res.json({ message: "PDF uploaded" });
    } catch {
        res.status(500).json({ error: "Upload failed" });
    }
};
