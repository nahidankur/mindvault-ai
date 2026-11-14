import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleDatabase } from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';
import { GeminiService } from '../ai-provider/gemini.service';
import { RAG_CONFIG, MessageSourceCitation } from '@mindvault/shared';

export interface RetrievalQueryOptions {
  query: string;
  userId: string;
  collectionId?: string | null;
  topK?: number;
}

export interface RetrievedChunk {
  chunkId: string;
  itemId: string;
  itemTitle: string;
  content: string;
  metadata?: any;
  vectorRank?: number;
  ftsRank?: number;
  vectorScore?: number;
  ftsScore?: number;
  rrfScore: number;
}

export interface RetrievalResult {
  query: string;
  chunks: RetrievedChunk[];
  citations: MessageSourceCitation[];
  isConfident: boolean;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Executes Hybrid Search (pgvector Cosine Similarity + PostgreSQL FTS)
   * and merges the candidate rankings using Reciprocal Rank Fusion (RRF).
   */
  async search(options: RetrievalQueryOptions): Promise<RetrievalResult> {
    const { query, userId, collectionId } = options;
    const topK = options.topK || RAG_CONFIG.TOP_K_RETRIEVAL;
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return { query, chunks: [], citations: [], isConfident: false };
    }

    this.logger.log(`Executing hybrid retrieval for user ${userId}: "${cleanQuery}"`);

    // 1. Generate query embedding
    const queryEmbedding = await this.geminiService.generateQueryEmbedding(cleanQuery);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // 2. Perform Vector Search (HNSW Cosine Distance)
    const vectorResults = await this.executeVectorSearch(userId, vectorString, collectionId);

    // 3. Perform Full-Text Search (PostgreSQL websearch_to_tsquery)
    const ftsResults = await this.executeFtsSearch(userId, cleanQuery, collectionId);

    // 4. Merge candidates with Reciprocal Rank Fusion (RRF)
    const mergedChunks = this.fuseResultsWithRRF(vectorResults, ftsResults);

    // 5. Select Top-K
    const topChunks = mergedChunks.slice(0, topK);

    // 6. Check confidence threshold
    const topScore = topChunks.length > 0 ? topChunks[0].rrfScore : 0;
    const isConfident = topScore >= RAG_CONFIG.MIN_CONFIDENCE_THRESHOLD && topChunks.length > 0;

    // 7. Format citations for UI and LLM context
    const citations: MessageSourceCitation[] = topChunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      itemId: chunk.itemId,
      itemTitle: chunk.itemTitle,
      rank: index + 1,
      score: Number(chunk.rrfScore.toFixed(4)),
      snippet: chunk.content.length > 200 ? `${chunk.content.substring(0, 200)}...` : chunk.content,
    }));

    return {
      query: cleanQuery,
      chunks: topChunks,
      citations,
      isConfident,
    };
  }

  private async executeVectorSearch(
    userId: string,
    vectorString: string,
    collectionId?: string | null,
  ): Promise<Array<{ chunkId: string; itemId: string; itemTitle: string; content: string; metadata: any; distance: number }>> {
    try {
      const collectionFilter = collectionId
        ? sql`AND i.collection_id = ${collectionId}::uuid`
        : sql``;

      const rows = await this.db.execute(sql`
        SELECT 
          c.id AS "chunkId",
          c.item_id AS "itemId",
          i.title AS "itemTitle",
          c.content,
          c.metadata,
          (c.embedding <=> ${vectorString}::vector) AS distance
        FROM knowledge_chunks c
        JOIN knowledge_items i ON c.item_id = i.id
        WHERE c.user_id = ${userId}::uuid
          AND i.status = 'READY'
          ${collectionFilter}
        ORDER BY distance ASC
        LIMIT 20;
      `);

      return (rows as any[]).map((r) => ({
        chunkId: r.chunkId,
        itemId: r.itemId,
        itemTitle: r.itemTitle,
        content: r.content,
        metadata: r.metadata,
        distance: Number(r.distance),
      }));
    } catch (err: any) {
      this.logger.warn(`Vector search error (${err?.message}). Falling back to empty vector results.`);
      return [];
    }
  }

  private async executeFtsSearch(
    userId: string,
    query: string,
    collectionId?: string | null,
  ): Promise<Array<{ chunkId: string; itemId: string; itemTitle: string; content: string; metadata: any; rank: number }>> {
    try {
      const collectionFilter = collectionId
        ? sql`AND i.collection_id = ${collectionId}::uuid`
        : sql``;

      const rows = await this.db.execute(sql`
        SELECT 
          c.id AS "chunkId",
          c.item_id AS "itemId",
          i.title AS "itemTitle",
          c.content,
          c.metadata,
          ts_rank_cd(c.tsv_content, websearch_to_tsquery('english', ${query})) AS rank
        FROM knowledge_chunks c
        JOIN knowledge_items i ON c.item_id = i.id
        WHERE c.user_id = ${userId}::uuid
          AND i.status = 'READY'
          AND c.tsv_content @@ websearch_to_tsquery('english', ${query})
          ${collectionFilter}
        ORDER BY rank DESC
        LIMIT 20;
      `);

      return (rows as any[]).map((r) => ({
        chunkId: r.chunkId,
        itemId: r.itemId,
        itemTitle: r.itemTitle,
        content: r.content,
        metadata: r.metadata,
        rank: Number(r.rank),
      }));
    } catch (err: any) {
      this.logger.warn(`FTS search error (${err?.message}). Falling back to empty FTS results.`);
      return [];
    }
  }

  /**
   * Reciprocal Rank Fusion: combines vector rank and keyword rank
   */
  private fuseResultsWithRRF(
    vectorCandidates: Array<{ chunkId: string; itemId: string; itemTitle: string; content: string; metadata: any; distance: number }>,
    ftsCandidates: Array<{ chunkId: string; itemId: string; itemTitle: string; content: string; metadata: any; rank: number }>,
  ): RetrievedChunk[] {
    const k = RAG_CONFIG.RRF_K_CONSTANT; // 60
    const chunkMap = new Map<string, RetrievedChunk>();

    // 1. Score vector candidates
    vectorCandidates.forEach((item, index) => {
      const rank = index + 1;
      const rrfScore = 1 / (k + rank);

      chunkMap.set(item.chunkId, {
        chunkId: item.chunkId,
        itemId: item.itemId,
        itemTitle: item.itemTitle,
        content: item.content,
        metadata: item.metadata,
        vectorRank: rank,
        vectorScore: 1 - item.distance,
        rrfScore,
      });
    });

    // 2. Score FTS candidates
    ftsCandidates.forEach((item, index) => {
      const rank = index + 1;
      const ftsRrf = 1 / (k + rank);

      if (chunkMap.has(item.chunkId)) {
        const existing = chunkMap.get(item.chunkId)!;
        existing.ftsRank = rank;
        existing.ftsScore = item.rank;
        existing.rrfScore += ftsRrf; // Combined fusion score
      } else {
        chunkMap.set(item.chunkId, {
          chunkId: item.chunkId,
          itemId: item.itemId,
          itemTitle: item.itemTitle,
          content: item.content,
          metadata: item.metadata,
          ftsRank: rank,
          ftsScore: item.rank,
          rrfScore: ftsRrf,
        });
      }
    });

    // 3. Sort by total RRF score descending
    return Array.from(chunkMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);
  }
}
