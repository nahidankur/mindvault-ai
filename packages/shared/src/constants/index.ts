// ==========================================
// System-wide Constants & Default Values
// ==========================================

export const APP_NAME = 'MindVault AI';
export const APP_DESCRIPTION = 'Personal Knowledge Vault powered by Grounded RAG';

// RAG & Ingestion Limits
export const RAG_CONFIG = {
  CHUNK_SIZE_TOKENS: 600,
  CHUNK_OVERLAP_TOKENS: 100,
  TOP_K_RETRIEVAL: 5,
  RRF_K_CONSTANT: 60,
  MIN_CONFIDENCE_THRESHOLD: 0.015,
  MAX_BATCH_EMBEDDING_SIZE: 10,
  VECTOR_DIMENSIONS: 768, // Google text-embedding-004
} as const;

// Text Validation Limits
export const KNOWLEDGE_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 500_000, // ~100k words
} as const;

// Queue Names
export const QUEUE_NAMES = {
  KNOWLEDGE_INGESTION: 'knowledge-ingestion-queue',
} as const;

// Job Names
export const JOB_NAMES = {
  PROCESS_TEXT: 'process-knowledge-text',
} as const;
