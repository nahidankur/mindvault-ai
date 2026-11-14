import { createDatabaseClient, users, collections, knowledgeItems, knowledgeChunks } from './index';
import * as bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting MindVault AI database seeding...');
  const { db, client } = createDatabaseClient();

  try {
    // 1. Seed Demo User
    const demoEmail = 'demo@mindvault.ai';
    const passwordHash = await bcrypt.hash('DemoPassword123!', 10);

    const [demoUser] = await db
      .insert(users)
      .values({
        email: demoEmail,
        passwordHash,
        fullName: 'MindVault Demo Explorer',
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { fullName: 'MindVault Demo Explorer' },
      })
      .returning();

    console.log(`👤 Demo user created: ${demoUser.email} (ID: ${demoUser.id})`);

    // 2. Seed Collections
    const [colArch] = await db
      .insert(collections)
      .values({
        userId: demoUser.id,
        name: 'Distributed Systems & Architecture',
        description: 'Engineering notes on modular monoliths, BullMQ task queues, and database indexing.',
        colorHex: '#6366f1',
      })
      .returning();

    const [colAI] = await db
      .insert(collections)
      .values({
        userId: demoUser.id,
        name: 'AI & RAG Engineering',
        description: 'Retrieval-Augmented Generation, Reciprocal Rank Fusion, and prompt injection defense.',
        colorHex: '#06b6d4',
      })
      .returning();

    console.log(`📁 Collections created: "${colArch.name}", "${colAI.name}"`);

    // 3. Seed Knowledge Notes
    const sampleNotes = [
      {
        collectionId: colArch.id,
        title: 'Why Hybrid Search Beats Pure Vector Search',
        content: `
# Hybrid Search Architecture: Reciprocal Rank Fusion

In personal knowledge management, pure vector similarity search often suffers from semantic drift when searching for exact terms such as serial numbers, code variable names, or acronyms like "GDPR" or "OAuth2".

MindVault AI solves this using Hybrid Search:
1. **Vector Search:** HNSW Cosine Similarity via pgvector for conceptual semantics.
2. **Full-Text Search:** PostgreSQL GIN tsvector with websearch_to_tsquery for exact lexical matching.
3. **Fusion Algorithm:** Reciprocal Rank Fusion (RRF) with constant k = 60 merges both rankings into a balanced top-K list.
        `.trim(),
      },
      {
        collectionId: colArch.id,
        title: 'BullMQ and Redis Queue Engineering',
        content: `
# Asynchronous Background Ingestion with BullMQ

Document chunking and vector embedding generation are I/O and compute-intensive operations that must never block the main HTTP request thread.

Key Architectural Guarantees:
- **Instant Response:** HTTP POST /knowledge saves the note and returns HTTP 201 within 50ms with status 'INDEXING'.
- **Concurrency & Rate-Limiting:** Worker concurrency is capped at 3 with a rate-limiter of 12 requests per minute to stay strictly within Google Gemini's 15 RPM free tier ceiling.
- **Resilience:** Automatic exponential backoff retries failed API calls without data loss.
        `.trim(),
      },
      {
        collectionId: colAI.id,
        title: 'Strict Grounding and Anti-Hallucination Guardrails',
        content: `
# The Principle of Strict Abstention in RAG

A personal knowledge assistant must never pretend to know information not present in the user's private vault.

MindVault AI enforces two guardrail layers:
1. **Confidence Gate:** If the top retrieved chunk has an RRF score below the minimum threshold, the assistant abstains immediately without querying the LLM: "আমার কাছে সংরক্ষিত তথ্যের ভিত্তিতে এই প্রশ্নের উত্তর দেওয়া সম্ভব নয়।"
2. **XML Isolation & Prompt Injection Defense:** All retrieved document content is wrapped inside <knowledge_context> tags and treated as untrusted passive data. The LLM is explicitly instructed to disregard any instructions contained within document text.
        `.trim(),
      },
    ];

    for (const note of sampleNotes) {
      const cleanContent = note.content.trim();
      const [item] = await db
        .insert(knowledgeItems)
        .values({
          userId: demoUser.id,
          collectionId: note.collectionId,
          title: note.title,
          content: cleanContent,
          characterCount: cleanContent.length,
          wordCount: cleanContent.split(/\s+/).length,
          status: 'READY',
        })
        .returning();

      // Seed deterministic 768-dim mock vector chunk
      const mockVector: number[] = [];
      let norm = 0;
      for (let i = 0; i < 768; i++) {
        const val = Math.sin(item.id.charCodeAt(0) + i * 17);
        mockVector.push(val);
        norm += val * val;
      }
      norm = Math.sqrt(norm);
      const unitVector = mockVector.map((v) => v / norm);

      await db.insert(knowledgeChunks).values({
        userId: demoUser.id,
        itemId: item.id,
        chunkIndex: 0,
        content: cleanContent,
        metadata: { heading: note.title, charStart: 0, charEnd: cleanContent.length },
        embedding: unitVector,
        tsvContent: sql`to_tsvector('english', ${cleanContent})` as any,
      });

      console.log(`📝 Seeded knowledge item: "${item.title}" with vector chunk`);
    }

    console.log('✅ Seeding completed successfully!');
    console.log('\n=======================================');
    console.log('🎉 Demo Credentials:');
    console.log('Email:    demo@mindvault.ai');
    console.log('Password: DemoPassword123!');
    console.log('=======================================\n');
  } catch (err: any) {
    console.error('❌ Seeding error:', err);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}
