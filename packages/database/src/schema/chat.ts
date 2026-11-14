import { pgTable, uuid, varchar, text, integer, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { collections } from './collections';
import { knowledgeItems, knowledgeChunks } from './knowledge';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id').references(() => collections.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 255 }).notNull().default('New Conversation'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_conversations_user_id').on(table.userId),
    index('idx_conversations_collection_id').on(table.collectionId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_messages_conversation_id').on(table.conversationId),
  ],
);

export const messageSources = pgTable(
  'message_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => knowledgeChunks.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: 'cascade' }),
    score: doublePrecision('score').notNull(),
    rank: integer('rank').notNull(),
    snippet: text('snippet').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_message_sources_message_id').on(table.messageId),
  ],
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [conversations.collectionId],
    references: [collections.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  sources: many(messageSources),
}));

export const messageSourcesRelations = relations(messageSources, ({ one }) => ({
  message: one(messages, {
    fields: [messageSources.messageId],
    references: [messages.id],
  }),
  chunk: one(knowledgeChunks, {
    fields: [messageSources.chunkId],
    references: [knowledgeChunks.id],
  }),
  item: one(knowledgeItems, {
    fields: [messageSources.itemId],
    references: [knowledgeItems.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageSource = typeof messageSources.$inferSelect;
export type NewMessageSource = typeof messageSources.$inferInsert;
