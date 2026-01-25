/**
 * Vision Service
 * Provides plant disease detection using vision-language model
 */

import fs from "fs";
import { hfClient } from "../config/ai.js";

/**
 * Analyzes plant image to detect diseases and provide recommendations
 * Uses Qwen vision model with base64-encoded image
 * @param {string} imagePath - Path to the uploaded plant image
 * @param {string} message - User's description or question about the plant
 * @param {string} language - Target language for the response
 * @returns {Promise<string>} Disease analysis and treatment recommendations
 * @throws {Error} If image reading or model inference fails
 */
export async function detectDisease(imagePath, message, language) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);

        let prompt = `You are an expert plant pathologist and agriculture assistant. Analyze the image and user description to identify any diseases or issues. Provide:
1. Disease identification (if any)
2. Severity level
3. Treatment recommendations
4. Prevention measures

User query: ${message}`;

        if (language && language !== "English") {
            prompt += `\n\nRespond ONLY in ${language}.`;
        }

        const response = await hfClient.chatCompletion({
            model: "Qwen/Qwen2.5-VL-7B-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000,
        });

        return response.choices[0]?.message?.content || "Unable to analyze the image.";
    } catch (error) {
        throw error;
    }
}
