import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, eq, count } from 'drizzle-orm';
import { DrizzleDatabase, collections, knowledgeItems, Collection, NewCollection } from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { CollectionSummary } from '@mindvault/shared';

@Injectable()
export class CollectionsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
  ) {}

  async findAll(userId: string): Promise<CollectionSummary[]> {
    // Left join with knowledgeItems to calculate item count per collection
    const rows = await this.db
      .select({
        id: collections.id,
        userId: collections.userId,
        name: collections.name,
        description: collections.description,
        colorHex: collections.colorHex,
        createdAt: collections.createdAt,
        itemCount: count(knowledgeItems.id),
      })
      .from(collections)
      .leftJoin(knowledgeItems, eq(knowledgeItems.collectionId, collections.id))
      .where(eq(collections.userId, userId))
      .groupBy(collections.id);

    return rows.map((row) => ({
      ...row,
      itemCount: Number(row.itemCount || 0),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async findById(userId: string, id: string): Promise<Collection> {
    const result = await this.db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)))
      .limit(1);

    if (!result[0]) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return result[0];
  }

  async create(userId: string, dto: CreateCollectionDto): Promise<Collection> {
    const newCollection: NewCollection = {
      userId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      colorHex: dto.colorHex || '#6366f1',
    };

    const result = await this.db
      .insert(collections)
      .values(newCollection)
      .returning();

    return result[0];
  }

  async update(userId: string, id: string, dto: UpdateCollectionDto): Promise<Collection> {
    await this.findById(userId, id); // Ensure exists & belongs to user

    const updateData: Partial<NewCollection> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.colorHex !== undefined) updateData.colorHex = dto.colorHex;

    const result = await this.db
      .update(collections)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(collections.id, id), eq(collections.userId, userId)))
      .returning();

    return result[0];
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    await this.findById(userId, id);

    await this.db
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));

    return { success: true };
  }
}
