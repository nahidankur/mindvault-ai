// ==========================================
// Core Domain Types & Enums
// ==========================================

export type KnowledgeSourceType = 'manual_note' | 'pasted_article' | 'research_doc';

export type KnowledgeStatus = 'DRAFT' | 'INDEXING' | 'READY' | 'FAILED';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface CollectionSummary {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  colorHex?: string | null;
  itemCount: number;
  createdAt: string;
}

export interface KnowledgeItemSummary {
  id: string;
  userId: string;
  collectionId?: string | null;
  title: string;
  sourceType: KnowledgeSourceType;
  characterCount: number;
  wordCount: number;
  status: KnowledgeStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunkMetadata {
  heading?: string;
  charStart?: number;
  charEnd?: number;
  sectionIndex?: number;
}

export interface KnowledgeChunkSummary {
  id: string;
  itemId: string;
  chunkIndex: number;
  content: string;
  metadata?: KnowledgeChunkMetadata;
  createdAt: string;
}

export interface MessageSourceCitation {
  chunkId: string;
  itemId: string;
  itemTitle: string;
  rank: number;
  score: number;
  snippet: string;
}

export interface ChatMessageSummary {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources?: MessageSourceCitation[];
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  collectionId?: string | null;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// API Standard Envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
