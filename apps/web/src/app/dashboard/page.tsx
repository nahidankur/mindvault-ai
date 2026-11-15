'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { KnowledgeItemSummary } from '@mindvault/shared';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAppStore();
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [recentNotes, setRecentNotes] = useState<KnowledgeItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    apiRequest<{ items: KnowledgeItemSummary[]; total: number }>('/knowledge?pageSize=4')
      .then((res) => {
        setTotalNotes(res.total || 0);
        setRecentNotes(res.items || []);
      })
      .catch(() => {
        setTotalNotes(0);
        setRecentNotes([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto overflow-y-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Welcome back, {user?.fullName || 'Architect'} 👋
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Your personal knowledge vault is synchronized and indexed with pgvector hybrid search.
        </p>
      </div>

      {/* Primary Metrics & Quick Action Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saved Notes Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Saved Notes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {isLoading ? '...' : totalNotes}
            </span>
            <span className="text-xs text-slate-500">items indexed</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>pgvector HNSW Ready</span>
          </div>
        </div>

        {/* Quick Add Note Card */}
        <Link
          href="/dashboard/knowledge"
          className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 hover:border-indigo-500/60 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
              Add New Note
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Save Markdown research or articles to vectorize in the background.
            </p>
          </div>
        </Link>

        {/* Quick Query Card */}
        <Link
          href="/dashboard/chat"
          className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/80 hover:border-cyan-500/60 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
              Ask RAG Assistant
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Chat with grounded answers, source citations, and zero hallucination.
            </p>
          </div>
        </Link>
      </div>

      {/* Main Feature Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/knowledge"
          className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700 transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                Knowledge Vault Library
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Browse, search, edit and manage all your stored documents, notes, and research papers.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              <span>Go to Knowledge Vault</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/chat"
          className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700 transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                Grounded RAG Assistant
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Query your knowledge vault in natural language with strict chunk citations and anti-hallucination guardrails.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              <span>Start a Conversation</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recently Added Notes Preview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Recently Added Knowledge Notes</h2>
          </div>
          <Link
            href="/dashboard/knowledge"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All Notes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Loading recent notes...
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No knowledge notes saved yet.</p>
            <Link
              href="/dashboard/knowledge"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first note</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href="/dashboard/knowledge"
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700 transition flex items-center justify-between group"
              >
                <div className="min-w-0 mr-3">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                    {note.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{note.wordCount} words</span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      note.status === 'READY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : note.status === 'INDEXING'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {note.status === 'READY' ? (
                      <CheckCircle className="w-2.5 h-2.5" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5" />
                    )}
                    <span>{note.status.toLowerCase()}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
