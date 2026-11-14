export interface RagTestCase {
  id: string;
  category:
    | 'single_doc_explicit'
    | 'multi_doc_synthesis'
    | 'strict_abstention'
    | 'distractor_misleading'
    | 'exact_keyword'
    | 'cross_tenant_isolation';
  question: string;
  expectedBehavior: 'answer' | 'abstain';
  expectedSnippetKeywords?: string[];
  documents: Array<{
    title: string;
    content: string;
    tenantId: string;
  }>;
  queryTenantId: string;
}

export const GOLDEN_RAG_DATASET: RagTestCase[] = [
  // --- 1. Single Document Explicit Answers (10 cases) ---
  {
    id: 'tc-01',
    category: 'single_doc_explicit',
    question: 'What is the refund policy duration for premium memberships?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['refund', '14 days', 'premium'],
    documents: [
      {
        title: 'Company Billing Policy',
        content: 'Premium memberships are eligible for a full refund within 14 days of purchase. After 14 days, no refunds are granted.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-02',
    category: 'single_doc_explicit',
    question: 'How many days of remote work are permitted per week?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['remote work', '2 days'],
    documents: [
      {
        title: 'HR Workplace Guidelines',
        content: 'All full-time engineers are permitted up to 2 days of remote work per week with prior manager approval.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-03',
    category: 'single_doc_explicit',
    question: 'What database engine and vector extension is MindVault AI using?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['PostgreSQL', 'pgvector'],
    documents: [
      {
        title: 'Architecture Specification',
        content: 'MindVault AI is built on PostgreSQL with the pgvector extension for HNSW vector cosine indexing.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-04',
    category: 'single_doc_explicit',
    question: 'What is the default port for the NestJS API server?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['4000', 'port'],
    documents: [
      {
        title: 'Deployment Guide',
        content: 'The NestJS backend server listens on port 4000 by default unless overridden by the PORT environment variable.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-05',
    category: 'single_doc_explicit',
    question: 'What is the target chunk size in tokens for the text splitter?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['600', 'tokens'],
    documents: [
      {
        title: 'RAG Pipeline Config',
        content: 'The recursive text splitter splits incoming markdown notes into target chunks of 600 tokens with 100 token overlap.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-06',
    category: 'single_doc_explicit',
    question: 'Which embedding model is used and what is its output dimension?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['text-embedding-004', '768'],
    documents: [
      {
        title: 'AI Specifications',
        content: 'We utilize Google text-embedding-004 which outputs dense vectors with 768 dimensions.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-07',
    category: 'single_doc_explicit',
    question: 'What is the password hashing algorithm and salt rounds?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['bcrypt', '10'],
    documents: [
      {
        title: 'Security Architecture',
        content: 'User passwords are encrypted using bcryptjs with 10 salt rounds before storage.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-08',
    category: 'single_doc_explicit',
    question: 'What rate limit is configured on Gemini embedding calls?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['12', 'minute'],
    documents: [
      {
        title: 'Queue Worker Config',
        content: 'BullMQ worker rate limiter is capped at 12 requests per minute to stay safely below the Gemini 15 RPM free tier ceiling.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-09',
    category: 'single_doc_explicit',
    question: 'What constant is used for Reciprocal Rank Fusion?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['k = 60', '60'],
    documents: [
      {
        title: 'Search Ranking Notes',
        content: 'Reciprocal Rank Fusion combines vector and FTS scores using the standard smoothing constant k = 60.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-10',
    category: 'single_doc_explicit',
    question: 'What frontend framework and version is utilized?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['Next.js 16.4', 'React 19'],
    documents: [
      {
        title: 'Web Stack',
        content: 'The frontend framework and version is Next.js 16.4 App Router and React 19.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },

  // --- 2. Multi-Document Synthesis (5 cases) ---
  {
    id: 'tc-11',
    category: 'multi_doc_synthesis',
    question: 'Combine the revenue target from Q3 and the marketing budget for Q4.',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['$500,000', '$50,000'],
    documents: [
      {
        title: 'Q3 Financial Targets',
        content: 'Our Q3 expansion target is to reach $500,000 in Annual Recurring Revenue.',
        tenantId: 'user-1',
      },
      {
        title: 'Q4 Marketing Budget Plan',
        content: 'The Q4 marketing and growth budget is allocated at $50,000 across digital channels.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-12',
    category: 'multi_doc_synthesis',
    question: 'What is the full backend tech stack combination?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['NestJS', 'BullMQ', 'PostgreSQL'],
    documents: [
      {
        title: 'API Framework',
        content: 'The backend web server runtime is NestJS on Node.js 22 LTS.',
        tenantId: 'user-1',
      },
      {
        title: 'Queue and Database',
        content: 'The backend data stack uses BullMQ workers and PostgreSQL storage.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-13',
    category: 'multi_doc_synthesis',
    question: 'Who is the project manager and what is the target launch date?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['Alex Mercer', 'December 15'],
    documents: [
      {
        title: 'Team Directory',
        content: 'Alex Mercer serves as the Lead Project Manager for MindVault AI.',
        tenantId: 'user-1',
      },
      {
        title: 'Milestone Roadmap',
        content: 'Production launch milestone and target date is scheduled for December 15.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-14',
    category: 'multi_doc_synthesis',
    question: 'What are the primary colors used for UI branding and where are they defined?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['#6366f1', 'tailwind.config.ts'],
    documents: [
      {
        title: 'Design System',
        content: 'Primary brand colors for UI are Indigo #6366f1 paired with Cyan accents.',
        tenantId: 'user-1',
      },
      {
        title: 'Tailwind Config Docs',
        content: 'UI branding colors are defined inside tailwind.config.ts.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-15',
    category: 'multi_doc_synthesis',
    question: 'What are the two search methods merged in hybrid retrieval?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['HNSW cosine', 'Full-Text Search'],
    documents: [
      {
        title: 'Vector Search Overview',
        content: 'Hybrid retrieval first search method uses HNSW cosine similarity on dense embeddings.',
        tenantId: 'user-1',
      },
      {
        title: 'Keyword Search Overview',
        content: 'Hybrid retrieval second search method utilizes PostgreSQL GIN Full-Text Search with websearch_to_tsquery.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },

  // --- 3. Strict Abstention (Answers Absent from Knowledge) (5 cases) ---
  {
    id: 'tc-16',
    category: 'strict_abstention',
    question: 'What is the secret recipe for Coca-Cola?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Office Coffee Machine Guide',
        content: 'The kitchen espresso machine requires descaling every first Monday of the month.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-17',
    category: 'strict_abstention',
    question: 'Who won the 2022 FIFA World Cup?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Company Sports Day',
        content: 'The annual company cricket tournament took place in October at the city park.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-18',
    category: 'strict_abstention',
    question: 'What is the stock price of Apple right now?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Equipment Allocation',
        content: 'Every developer receives a MacBook Pro 16-inch upon onboarding.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-19',
    category: 'strict_abstention',
    question: 'What is the CEO personal phone number?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Contact Directory',
        content: 'For office inquiries, contact reception@company.com during business hours.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-20',
    category: 'strict_abstention',
    question: 'What were our company earnings in the year 1995?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Company History',
        content: 'The company was founded in 2021 as a remote-first software consulting agency.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },

  // --- 4. Distractor / Misleading Information (5 cases) ---
  {
    id: 'tc-21',
    category: 'distractor_misleading',
    question: 'What is the warranty period for Laptop model X1?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['Model X1', '3 years'],
    documents: [
      {
        title: 'Hardware Warranties',
        content: 'Model Y2 has a 1-year warranty. Model Z3 has a 2-year warranty. In contrast, Model X1 includes an extended 3 years full warranty coverage.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-22',
    category: 'distractor_misleading',
    question: 'Which cloud database host is used for production?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['Neon', 'production'],
    documents: [
      {
        title: 'Database Environments',
        content: 'For local testing we use Docker PostgreSQL. For staging we previously evaluated Supabase. For production, Neon Serverless PostgreSQL is our official host.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-23',
    category: 'distractor_misleading',
    question: 'What is the retention period for deleted notes?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['permanent', 'immediate'],
    documents: [
      {
        title: 'Data Retention Policy',
        content: 'Log files are retained for 30 days. Backup snapshots are kept for 7 days. Deleted user notes however are deleted permanently and immediately from the database.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-24',
    category: 'distractor_misleading',
    question: 'What is the maximum character size for pasted notes?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['500,000 characters'],
    documents: [
      {
        title: 'Content Limits',
        content: 'Titles are restricted to 200 characters. Single paragraph previews are 200 chars. Maximum note content size is permitted up to 500,000 characters.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-25',
    category: 'distractor_misleading',
    question: 'Which Redis provider was chosen to avoid command limits?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['Aiven'],
    documents: [
      {
        title: 'Redis Hosting Decision',
        content: 'Upstash provides 10,000 daily commands but BullMQ exhausts this rapidly. Therefore, Aiven Free Redis is chosen as the cloud queue host.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },

  // --- 5. Exact Keyword & Code Identifiers (3 cases) ---
  {
    id: 'tc-26',
    category: 'exact_keyword',
    question: 'What is the exact name of the queue constant?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['KNOWLEDGE_INGESTION', 'knowledge-ingestion-queue'],
    documents: [
      {
        title: 'Constants Reference',
        content: 'The queue name is defined in QUEUE_NAMES.KNOWLEDGE_INGESTION with value "knowledge-ingestion-queue".',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-27',
    category: 'exact_keyword',
    question: 'What is the exact database table name for chunks?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['knowledge_chunks'],
    documents: [
      {
        title: 'Schema DDL',
        content: 'Table knowledge_chunks stores individual vectors and full-text tsvector data.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },
  {
    id: 'tc-28',
    category: 'exact_keyword',
    question: 'What is the exact index operator for HNSW cosine distance?',
    expectedBehavior: 'answer',
    expectedSnippetKeywords: ['vector_cosine_ops'],
    documents: [
      {
        title: 'Vector Index DDL',
        content: 'The index is defined using HNSW with operator class vector_cosine_ops.',
        tenantId: 'user-1',
      },
    ],
    queryTenantId: 'user-1',
  },

  // --- 6. Cross-Tenant Data Isolation (2 cases) ---
  {
    id: 'tc-29',
    category: 'cross_tenant_isolation',
    question: 'What is the salary of User Beta?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'User Beta Private Compensation',
        content: 'User Beta base salary is $160,000 per annum with a 15% annual bonus.',
        tenantId: 'user-2', // Belonging to User 2
      },
    ],
    queryTenantId: 'user-1', // Queried by User 1!
  },
  {
    id: 'tc-30',
    category: 'cross_tenant_isolation',
    question: 'What is User Gamma secret project codename?',
    expectedBehavior: 'abstain',
    documents: [
      {
        title: 'Project Apollo Confidential',
        content: 'User Gamma secret initiative is codenamed Project Apollo.',
        tenantId: 'user-3', // Belonging to User 3
      },
    ],
    queryTenantId: 'user-1', // Queried by User 1!
  },
];
