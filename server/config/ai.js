/**
 * AI Configuration
 * Initializes HuggingFace client, embeddings model, and Qdrant vector store
 * Used for RAG (Retrieval-Augmented Generation) document retrieval
 */

import { InferenceClient } from "@huggingface/inference";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";

// HuggingFace client for LLM and vision models
export const hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// Embeddings model for document vectorization
export const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2",
});

// Vector store: connects to Qdrant or creates new collection if none exists
let vectorStore;
try {
    vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "langchainjs-testing",
    });
} catch (error) {
    vectorStore = new QdrantVectorStore(embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "langchainjs-testing",
    });
}

export { vectorStore };
// Retriever configured to return top 4 most relevant documents
export const retriever = vectorStore.asRetriever({ k: 4 });
