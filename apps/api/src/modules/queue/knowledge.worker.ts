import { Injectable, Logger, OnModuleInit, OnApplicationShutdown, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { sql, eq } from 'drizzle-orm';
import { QUEUE_NAMES, JOB_NAMES } from '@mindvault/shared';
import { DrizzleDatabase, knowledgeItems, knowledgeChunks, NewKnowledgeChunk } from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';
import { QueueService, IngestionJobData } from './queue.service';
import { ChunkerService } from '../chunker/chunker.service';
import { GeminiService } from '../ai-provider/gemini.service';

@Injectable()
export class KnowledgeWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KnowledgeWorker.name);
  private worker: Worker<IngestionJobData> | null = null;

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
    private readonly queueService: QueueService,
    private readonly chunkerService: ChunkerService,
    private readonly geminiService: GeminiService,
  ) {}

  onModuleInit() {
    this.startWorker();
  }

  private startWorker() {
    try {
      const connection = this.queueService.getRedisOptions();

      this.worker = new Worker<IngestionJobData>(
        QUEUE_NAMES.KNOWLEDGE_INGESTION,
        async (job: Job<IngestionJobData>) => {
          if (job.name === JOB_NAMES.PROCESS_TEXT) {
            await this.processIngestion(job.data);
          }
        },
        {
          connection,
          concurrency: 3, // Rate-limit safe concurrency for Gemini free tier
          limiter: {
            max: 12, // Max 12 requests per minute (Gemini free limit is 15 RPM)
            duration: 60000,
          },
        },
      );

      this.worker.on('completed', (job) => {
        this.logger.log(`Job completed: ${job.id} for item: ${job.data.itemId}`);
      });

      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job failed: ${job?.id} error: ${err.message}`, err.stack);
      });

      this.logger.log('BullMQ Knowledge Ingestion Worker started');
    } catch (err: any) {
      this.logger.warn(`Could not start BullMQ worker: ${err?.message}`);
    }
  }

  /**
   * Core text processing, chunking, embedding, and vector storage logic
   */
  async processIngestion(data: IngestionJobData): Promise<void> {
    const { itemId, userId, text } = data;
    this.logger.log(`Processing ingestion for item: ${itemId} (${text.length} chars)`);

    try {
      // 1. Update status to INDEXING
      await this.db
        .update(knowledgeItems)
        .set({ status: 'INDEXING', errorMessage: null, updatedAt: new Date() })
        .where(eq(knowledgeItems.id, itemId));

      // 2. Split text into recursive semantic chunks
      const chunks = this.chunkerService.splitText(text);
      if (!chunks.length) {
        throw new Error('No valid text content found after normalization');
      }

      this.logger.log(`Generated ${chunks.length} chunks for item: ${itemId}. Generating embeddings...`);

      // 3. Generate 768-dimensional embeddings via Gemini
      const chunkContents = chunks.map((c) => c.content);
      const embeddings = await this.geminiService.generateEmbeddings(chunkContents);

      // 4. Delete old chunks if updating an existing item (Idempotency)
      await this.db
        .delete(knowledgeChunks)
        .where(eq(knowledgeChunks.itemId, itemId));

      // 5. Bulk insert chunks into knowledge_chunks with vector and tsvector
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        await this.db.insert(knowledgeChunks).values({
          userId,
          itemId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding,
          // Generate PostgreSQL tsvector on the fly
          tsvContent: sql`to_tsvector('english', ${chunk.content})` as any,
        });
      }

      // 6. Mark item as READY
      await this.db
        .update(knowledgeItems)
        .set({ status: 'READY', updatedAt: new Date() })
        .where(eq(knowledgeItems.id, itemId));

      this.logger.log(`Item ${itemId} successfully indexed with ${chunks.length} vector chunks!`);
    } catch (err: any) {
      this.logger.error(`Ingestion failed for item ${itemId}: ${err?.message}`, err.stack);
      await this.db
        .update(knowledgeItems)
        .set({
          status: 'FAILED',
          errorMessage: err?.message || 'Unknown processing error',
          updatedAt: new Date(),
        })
        .where(eq(knowledgeItems.id, itemId));
      throw err;
    }
  }

  async onApplicationShutdown() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
