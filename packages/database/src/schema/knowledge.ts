import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users';
import { collections } from './collections';
import { vector, tsvector } from './types';

export const knowledgeItems = pgTable(
  'knowledge_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id').references(() => collections.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 255 }).notNull(),
    sourceType: varchar('source_type', { length: 50 }).notNull().default('manual_note'),
    content: text('content').notNull(),
    characterCount: integer('character_count').notNull().default(0),
    wordCount: integer('word_count').notNull().default(0),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_knowledge_items_user_id').on(table.userId),
    index('idx_knowledge_items_collection_id').on(table.collectionId),
    index('idx_knowledge_items_status').on(table.status),
  ],
);

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    embedding: vector('embedding', { dimensions: 768 }),
    tsvContent: tsvector('tsv_content'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_knowledge_chunks_user_item').on(table.userId, table.itemId),
    index('idx_knowledge_chunks_item_id').on(table.itemId),
    // HNSW index for vector cosine distance
    index('idx_knowledge_chunks_embedding_hnsw').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
    // GIN index for full-text search
    index('idx_knowledge_chunks_tsv_gin').using('gin', table.tsvContent),
  ],
);

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeItems.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [knowledgeItems.collectionId],
    references: [collections.id],
  }),
  chunks: many(knowledgeChunks),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  user: one(users, {
    fields: [knowledgeChunks.userId],
    references: [users.id],
  }),
  item: one(knowledgeItems, {
    fields: [knowledgeChunks.itemId],
    references: [knowledgeItems.id],
  }),
}));

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type NewKnowledgeItem = typeof knowledgeItems.$inferInsert;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
