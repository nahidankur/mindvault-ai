import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
import {
  DrizzleDatabase,
  conversations,
  messages,
  messageSources,
  Conversation,
  Message,
} from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { RetrievalService } from '../retrieval/retrieval.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiService } from '../ai-provider/gemini.service';
import { MessageSourceCitation, ConversationSummary } from '@mindvault/shared';

export interface ChatAnswerResult {
  userMessage: Message;
  assistantMessage: Message;
  sources: MessageSourceCitation[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
    private readonly retrievalService: RetrievalService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly geminiService: GeminiService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const [conversation] = await this.db
      .insert(conversations)
      .values({
        userId,
        collectionId: dto.collectionId || null,
        title: dto.title?.trim() || 'New Conversation',
      })
      .returning();

    return conversation;
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const rows = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      collectionId: r.collectionId,
      title: r.title,
      messageCount: 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getConversation(userId: string, id: string): Promise<{ conversation: Conversation; messages: any[] }> {
    const [conversation] = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .limit(1);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    const messageList = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    // Fetch citations for assistant messages
    const messageIds = messageList.map((m) => m.id);
    const sourcesList = messageIds.length
      ? await this.db.select().from(messageSources)
      : [];

    const enrichedMessages = messageList.map((m) => ({
      ...m,
      sources: sourcesList.filter((s) => s.messageId === m.id),
    }));

    return {
      conversation,
      messages: enrichedMessages,
    };
  }

  async deleteConversation(userId: string, id: string): Promise<{ success: boolean }> {
    await this.getConversation(userId, id);

    await this.db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

    return { success: true };
  }

  /**
   * Non-streaming grounded Q&A with RAG
   */
  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto): Promise<ChatAnswerResult> {
    const { conversation } = await this.getConversation(userId, conversationId);
    const question = dto.question.trim();

    // 1. Save user message to database
    const [userMessage] = await this.db
      .insert(messages)
      .values({
        conversationId,
        userId,
        role: 'user',
        content: question,
      })
      .returning();

    // Update conversation title if first message
    if (conversation.title === 'New Conversation') {
      const autoTitle = question.length > 40 ? `${question.substring(0, 37)}...` : question;
      await this.db
        .update(conversations)
        .set({ title: autoTitle, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    // 2. Perform hybrid retrieval
    const retrieval = await this.retrievalService.search({
      query: question,
      userId,
      collectionId: conversation.collectionId,
    });

    let assistantContent = '';
    const sourcesToSave = retrieval.isConfident ? retrieval.citations : [];

    // 3. Strict Abstention Guardrail: If no evidence or low confidence, abstain directly
    if (!retrieval.isConfident || retrieval.chunks.length === 0) {
      this.logger.log(`Strict abstention triggered for query: "${question}" (no confident evidence)`);
      assistantContent = PromptBuilderService.ABSTENTION_MESSAGE;
    } else {
      // 4. Build prompt and query LLM
      const promptContext = this.promptBuilder.buildGroundedPrompt(question, retrieval.chunks);
      assistantContent = await this.geminiService.generateGroundedAnswer(
        promptContext.systemPrompt,
        promptContext.userPrompt,
      );
    }

    // 5. Save assistant message
    const [assistantMessage] = await this.db
      .insert(messages)
      .values({
        conversationId,
        userId,
        role: 'assistant',
        content: assistantContent,
      })
      .returning();

    // 6. Save message sources
    for (const source of sourcesToSave) {
      await this.db.insert(messageSources).values({
        messageId: assistantMessage.id,
        chunkId: source.chunkId,
        itemId: source.itemId,
        score: source.score,
        rank: source.rank,
        snippet: source.snippet,
      });
    }

    // Touch conversation updated_at
    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return {
      userMessage,
      assistantMessage,
      sources: sourcesToSave,
    };
  }

  /**
   * Server-Sent Events (SSE) streaming grounded answer
   */
  async streamMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
    onChunk: (data: string) => void,
  ): Promise<void> {
    const { conversation } = await this.getConversation(userId, conversationId);
    const question = dto.question.trim();

    // 1. Save user message
    await this.db.insert(messages).values({
      conversationId,
      userId,
      role: 'user',
      content: question,
    });

    // 2. Retrieve
    const retrieval = await this.retrievalService.search({
      query: question,
      userId,
      collectionId: conversation.collectionId,
    });

    // Send retrieved sources first
    onChunk(JSON.stringify({ type: 'sources', sources: retrieval.isConfident ? retrieval.citations : [] }));

    let fullAnswer = '';

    if (!retrieval.isConfident || retrieval.chunks.length === 0) {
      fullAnswer = PromptBuilderService.ABSTENTION_MESSAGE;
      onChunk(JSON.stringify({ type: 'token', content: fullAnswer }));
    } else {
      const promptContext = this.promptBuilder.buildGroundedPrompt(question, retrieval.chunks);
      for await (const token of this.geminiService.streamGroundedAnswer(
        promptContext.systemPrompt,
        promptContext.userPrompt,
      )) {
        fullAnswer += token;
        onChunk(JSON.stringify({ type: 'token', content: token }));
      }
    }

    // Save assistant message to DB
    const [assistantMessage] = await this.db
      .insert(messages)
      .values({
        conversationId,
        userId,
        role: 'assistant',
        content: fullAnswer,
      })
      .returning();

    if (retrieval.isConfident) {
      for (const source of retrieval.citations) {
        await this.db.insert(messageSources).values({
          messageId: assistantMessage.id,
          chunkId: source.chunkId,
          itemId: source.itemId,
          score: source.score,
          rank: source.rank,
          snippet: source.snippet,
        });
      }
    }

    onChunk(JSON.stringify({ type: 'done', messageId: assistantMessage.id }));
  }
}
