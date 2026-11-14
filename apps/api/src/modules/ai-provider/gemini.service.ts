import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RAG_CONFIG } from '@mindvault/shared';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly apiKey: string | undefined;
  private readonly chatModel: string;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.chatModel = this.configService.get<string>('GEMINI_CHAT_MODEL', 'gemini-2.0-flash');
    this.embeddingModel = this.configService.get<string>(
      'GEMINI_EMBEDDING_MODEL',
      'text-embedding-004',
    );

    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.logger.log(`Gemini AI Service initialized with chat: ${this.chatModel}`);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not provided. Fallback deterministic vector generator will be active.',
      );
    }
  }

  /**
   * Generates 768-dimensional embeddings for an array of text chunks
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    // Fallback if no valid Gemini API key is configured
    if (!this.genAI) {
      return texts.map((t) => this.generateDeterministicMockVector(t, RAG_CONFIG.VECTOR_DIMENSIONS));
    }

    const embeddings: number[][] = [];
    const batchSize = RAG_CONFIG.MAX_BATCH_EMBEDDING_SIZE; // 10

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.embedBatchWithRetry(batch);
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Generates an embedding for a single search query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    const vectors = await this.generateEmbeddings([query]);
    return vectors[0];
  }

  /**
   * Generates non-streaming answer with strict temperature
   */
  async generateGroundedAnswer(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.genAI) {
      return `[Mock AI Response - No Gemini API Key configured]\nBased on provided notes: Information successfully processed.`;
    }

    const model = this.genAI.getGenerativeModel({
      model: this.chatModel,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.1, // Near-zero temperature for grounded, non-hallucinatory facts
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  /**
   * Streams grounded answer token by token for Server-Sent Events (SSE)
   */
  async *streamGroundedAnswer(
    systemPrompt: string,
    userPrompt: string,
  ): AsyncGenerator<string, void, unknown> {
    if (!this.genAI) {
      const mockWords = [
        'আপনার', ' সংরক্ষিত', ' নোটসের', ' তথ্যের', ' ভিত্তিতে', ' উত্তর', ' প্রদান', ' করা', ' হচ্ছে।',
      ];
      for (const word of mockWords) {
        yield word;
        await new Promise((r) => setTimeout(r, 40));
      }
      return;
    }

    const model = this.genAI.getGenerativeModel({
      model: this.chatModel,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const streamResult = await model.generateContentStream(userPrompt);
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  private async embedBatchWithRetry(batch: string[]): Promise<number[][]> {
    const model = this.genAI!.getGenerativeModel({ model: this.embeddingModel });
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const promises = batch.map(async (text) => {
          const res = await model.embedContent(text);
          return res.embedding.values;
        });

        return await Promise.all(promises);
      } catch (err: any) {
        attempts++;
        const isRateLimited = err?.status === 429 || err?.message?.includes('429');
        if (isRateLimited && attempts < maxAttempts) {
          const backoff = Math.pow(2, attempts) * 1000;
          this.logger.warn(`Gemini 429 rate limit hit. Backing off for ${backoff}ms (attempt ${attempts}/${maxAttempts})...`);
          await new Promise((r) => setTimeout(r, backoff));
        } else {
          this.logger.error(`Error embedding batch with Gemini: ${err?.message}`, err);
          // Fallback to deterministic vector to prevent pipeline stall
          return batch.map((t) => this.generateDeterministicMockVector(t, RAG_CONFIG.VECTOR_DIMENSIONS));
        }
      }
    }

    return batch.map((t) => this.generateDeterministicMockVector(t, RAG_CONFIG.VECTOR_DIMENSIONS));
  }

  /**
   * Generates a deterministic normalized unit vector for mock / testing / zero-cost fallback
   */
  private generateDeterministicMockVector(text: string, dimensions = 768): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const vector: number[] = [];
    let norm = 0;

    for (let i = 0; i < dimensions; i++) {
      // Deterministic pseudorandom float between -1 and 1
      const val = Math.sin(hash + i * 1337);
      vector.push(val);
      norm += val * val;
    }

    // Normalize to unit length (L2 norm) for cosine distance
    norm = Math.sqrt(norm);
    return vector.map((v) => (norm > 0 ? v / norm : 0));
  }
}
