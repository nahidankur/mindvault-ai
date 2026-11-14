import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { and, eq, ilike, desc, count, sql } from 'drizzle-orm';
import {
  DrizzleDatabase,
  knowledgeItems,
  knowledgeChunks,
  KnowledgeItem,
  NewKnowledgeItem,
} from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';
import { CreateKnowledgeDto, UpdateKnowledgeDto, QueryKnowledgeDto } from './dto/knowledge.dto';
import { QueueService } from '../queue/queue.service';
import { KnowledgeWorker } from '../queue/knowledge.worker';
import { PaginatedResponse } from '@mindvault/shared';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
    private readonly queueService: QueueService,
    private readonly knowledgeWorker: KnowledgeWorker,
  ) {}

  async findAll(
    userId: string,
    query: QueryKnowledgeDto,
  ): Promise<PaginatedResponse<KnowledgeItem>> {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(knowledgeItems.userId, userId)];

    if (query.collectionId) {
      conditions.push(eq(knowledgeItems.collectionId, query.collectionId));
    }

    if (query.status) {
      conditions.push(eq(knowledgeItems.status, query.status));
    }

    if (query.search) {
      const searchTerm = `%${query.search.trim()}%`;
      conditions.push(ilike(knowledgeItems.title, searchTerm));
    }

    const whereClause = and(...conditions);

    // Count total matching items
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(knowledgeItems)
      .where(whereClause);

    const total = Number(totalRow?.count || 0);

    // Select paginated items
    const items = await this.db
      .select()
      .from(knowledgeItems)
      .where(whereClause)
      .orderBy(desc(knowledgeItems.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    };
  }

  async findById(userId: string, id: string): Promise<KnowledgeItem> {
    const result = await this.db
      .select()
      .from(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, userId)))
      .limit(1);

    if (!result[0]) {
      throw new NotFoundException(`Knowledge item with ID ${id} not found`);
    }

    return result[0];
  }

  async create(userId: string, dto: CreateKnowledgeDto): Promise<KnowledgeItem> {
    const cleanContent = dto.content.trim();
    const characterCount = cleanContent.length;
    const wordCount = cleanContent ? cleanContent.split(/\s+/).filter(Boolean).length : 0;

    const newItem: NewKnowledgeItem = {
      userId,
      collectionId: dto.collectionId || null,
      title: dto.title.trim(),
      sourceType: dto.sourceType || 'manual_note',
      content: cleanContent,
      characterCount,
      wordCount,
      status: 'INDEXING',
    };

    const [created] = await this.db
      .insert(knowledgeItems)
      .values(newItem)
      .returning();

    // Trigger async background ingestion job
    await this.triggerIngestion(created.id, userId, cleanContent);

    return created;
  }

  async update(userId: string, id: string, dto: UpdateKnowledgeDto): Promise<KnowledgeItem> {
    const existing = await this.findById(userId, id);

    const updateData: Partial<NewKnowledgeItem> = {};
    let contentChanged = false;

    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.collectionId !== undefined) updateData.collectionId = dto.collectionId;
    if (dto.content !== undefined) {
      const cleanContent = dto.content.trim();
      updateData.content = cleanContent;
      updateData.characterCount = cleanContent.length;
      updateData.wordCount = cleanContent ? cleanContent.split(/\s+/).filter(Boolean).length : 0;
      updateData.status = 'INDEXING';
      contentChanged = true;
    }

    const [updated] = await this.db
      .update(knowledgeItems)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, userId)))
      .returning();

    if (contentChanged && updateData.content) {
      await this.triggerIngestion(updated.id, userId, updateData.content);
    }

    return updated;
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    await this.findById(userId, id);

    // Delete item (cascades automatically to knowledge_chunks)
    await this.db
      .delete(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, userId)));

    return { success: true };
  }

  async reindex(userId: string, id: string): Promise<KnowledgeItem> {
    const item = await this.findById(userId, id);

    await this.db
      .update(knowledgeItems)
      .set({ status: 'INDEXING', errorMessage: null, updatedAt: new Date() })
      .where(eq(knowledgeItems.id, id));

    await this.triggerIngestion(item.id, userId, item.content);
    return this.findById(userId, id);
  }

  private async triggerIngestion(itemId: string, userId: string, text: string) {
    try {
      await this.queueService.addIngestionJob({ itemId, userId, text });
    } catch (err: any) {
      this.logger.warn(`Queue dispatch failed (${err?.message}). Running worker inline fallback...`);
      // Run async non-blocking inline fallback so development never breaks
      this.knowledgeWorker.processIngestion({ itemId, userId, text }).catch((e) => {
        this.logger.error(`Inline ingestion fallback failed: ${e?.message}`);
      });
    }
  }
}
