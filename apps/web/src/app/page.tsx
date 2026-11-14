import Link from 'next/link';
import { APP_NAME, APP_DESCRIPTION } from '@mindvault/shared';
import { Sparkles, ShieldCheck, Database, Cpu, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium text-indigo-400 border rounded-full border-indigo-500/20 bg-indigo-500/10">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Grounded RAG Architecture • Zero-Cost Stack</span>
      </div>

      <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-100">
        Personal Knowledge Vault powered by{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          MindVault AI
        </span>
      </h1>

      <p className="max-w-2xl mt-6 text-lg text-slate-400 leading-relaxed">
        {APP_DESCRIPTION}. Save your notes, research, and articles. Ask natural language questions with 100% grounded citations and strict anti-hallucination guardrails.
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 gap-4 mt-12 max-w-3xl sm:grid-cols-3 text-left">
        <div className="p-5 border rounded-xl border-slate-800 bg-slate-900/50 backdrop-blur">
          <Database className="w-6 h-6 text-indigo-400 mb-3" />
          <h3 className="font-semibold text-slate-200">Hybrid Search</h3>
          <p className="mt-1 text-sm text-slate-400">
            pgvector HNSW cosine similarity fused with PostgreSQL Full-Text Search via Reciprocal Rank Fusion.
          </p>
        </div>

        <div className="p-5 border rounded-xl border-slate-800 bg-slate-900/50 backdrop-blur">
          <Cpu className="w-6 h-6 text-cyan-400 mb-3" />
          <h3 className="font-semibold text-slate-200">BullMQ Processing</h3>
          <p className="mt-1 text-sm text-slate-400">
            Non-blocking asynchronous text chunking and rate-limited embedding batching with Redis.
          </p>
        </div>

        <div className="p-5 border rounded-xl border-slate-800 bg-slate-900/50 backdrop-blur">
          <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
          <h3 className="font-semibold text-slate-200">Strict Citations</h3>
          <p className="mt-1 text-sm text-slate-400">
            Every answer is verified against exact chunk references with explicit abstention on missing data.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
        <div className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg border-slate-800 bg-slate-900 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Phase 1: Foundation Ready (Next.js 16.4 & NestJS)</span>
        </div>
      </div>
    </main>
  );
}
