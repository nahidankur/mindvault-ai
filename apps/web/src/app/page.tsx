'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { APP_NAME, APP_DESCRIPTION } from '@mindvault/shared';
import {
  Sparkles,
  ShieldCheck,
  Database,
  Cpu,
  ArrowRight,
  LogIn,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      // Automatically redirect authenticated visitors directly to dashboard
      router.replace('/dashboard');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">
              {APP_NAME}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium text-emerald-400 border rounded-full border-emerald-500/20 bg-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Production Ready • 100% Grounded RAG • Zero Hallucination</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-100 leading-tight">
          Personal Knowledge Vault powered by{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
            Grounded AI
          </span>
        </h1>

        <p className="max-w-2xl mt-6 text-base sm:text-lg text-slate-400 leading-relaxed">
          {APP_DESCRIPTION}. Save your notes, research, and technical articles. Ask natural language questions with 100% verified citations, hybrid search ranking, and strict anti-hallucination guardrails.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 group"
          >
            <span>Launch Knowledge Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium text-sm transition flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Sign In / Demo Login</span>
            </Link>
          )}
        </div>

        {/* Quick Demo Credentials Box (only for visitors not signed in) */}
        {!isAuthenticated && (
          <div className="mt-8 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 max-w-md w-full text-xs text-slate-400 flex items-center justify-between">
            <div className="text-left font-mono">
              <p className="text-slate-300 font-semibold">Demo Account:</p>
              <p className="text-[11px] text-slate-400">demo@mindvault.ai • DemoPassword123!</p>
            </div>
            <Link
              href="/login"
              className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition"
            >
              Auto-fill
            </Link>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 gap-4 mt-16 max-w-4xl sm:grid-cols-3 text-left w-full">
          <div className="p-5 border rounded-2xl border-slate-800/80 bg-slate-900/40 backdrop-blur">
            <Database className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-slate-200 text-sm">Hybrid Retrieval (RRF)</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              pgvector HNSW dense cosine similarity merged with PostgreSQL Full-Text Search via Reciprocal Rank Fusion.
            </p>
          </div>

          <div className="p-5 border rounded-2xl border-slate-800/80 bg-slate-900/40 backdrop-blur">
            <Cpu className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-slate-200 text-sm">BullMQ Task Queue</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Non-blocking asynchronous text chunking and rate-limited embedding batching with Redis.
            </p>
          </div>

          <div className="p-5 border rounded-2xl border-slate-800/80 bg-slate-900/40 backdrop-blur">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-slate-200 text-sm">Strict Grounding & Citations</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Interactive citations mapped to exact chunk sources with automatic abstention on missing data.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>MindVault AI — Grounded Personal Knowledge Vault • Next.js 16.4 & NestJS Monorepo</p>
      </footer>
    </div>
  );
}
