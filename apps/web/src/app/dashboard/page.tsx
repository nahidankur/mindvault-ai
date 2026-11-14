'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Database,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { APP_NAME } from '@mindvault/shared';

export default function DashboardOverviewPage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState({ notes: 0, collections: 0, chats: 0 });

  useEffect(() => {
    Promise.all([
      apiRequest<{ total: number }>('/knowledge?pageSize=1').catch(() => ({ total: 0 })),
      apiRequest<any[]>('/collections').catch(() => []),
      apiRequest<any[]>('/chat/conversations').catch(() => []),
    ]).then(([knowledgeRes, collectionsRes, chatsRes]) => {
      setStats({
        notes: knowledgeRes.total || 0,
        collections: collectionsRes.length || 0,
        chats: chatsRes.length || 0,
      });
    });
  }, []);

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Welcome back, {user?.fullName || 'Architect'} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your personal knowledge vault is synchronized and indexed with pgvector hybrid search.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved Notes</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{stats.notes}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Collections</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{stats.collections}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversations</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{stats.chats}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/knowledge"
          className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all group flex items-start justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Knowledge Note</span>
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Paste Markdown research, notes, or articles. BullMQ will chunk and index them into vector embeddings in the background.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0 ml-4 mt-1" />
        </Link>

        <Link
          href="/dashboard/chat"
          className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all group flex items-start justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Query Knowledge Vault</span>
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Ask natural language questions. Get answers backed by verified source citations and strict anti-hallucination guardrails.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0 ml-4 mt-1" />
        </Link>
      </div>

      {/* Architecture Badges */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Architecture Status & Verification
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neon pgvector HNSW</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Postgres Full-Text (GIN)</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>BullMQ Background Ingestion</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Google Gemini Flash & text-embedding-004</span>
          </span>
        </div>
      </div>
    </div>
  );
}
