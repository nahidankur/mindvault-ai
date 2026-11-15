'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { KnowledgeItemSummary } from '@mindvault/shared';
import { KnowledgeModal } from './knowledge-modal';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
} from 'lucide-react';

export function KnowledgeView() {
  const [items, setItems] = useState<KnowledgeItemSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for status updates while any item is INDEXING
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const loadData = async (showLoading = true) => {
    try {
      const itemsRes = await apiRequest<{ items: KnowledgeItemSummary[] }>(
        `/knowledge${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`,
      );
      setItems(itemsRes.items || []);
    } catch {
      //
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });
      setTitle('');
      setContent('');
      setIsCreating(false);
      loadData();
    } catch (err: any) {
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note and its vector embeddings?')) return;
    try {
      await apiRequest(`/knowledge/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await apiRequest(`/knowledge/${id}/reindex`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(`Could not reindex: ${err.message}`);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">
            Knowledge Vault Library
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note / Article</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Creator Form */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 backdrop-blur space-y-4 max-w-3xl mx-auto shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Save New Knowledge Note</span>
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 font-mono">
                <span>{charCount} chars</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>
            </div>

            <div className="w-full">
              <input
                type="text"
                placeholder="Note title or document topic..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <textarea
              rows={7}
              placeholder="Paste research, meeting notes, or article content in Markdown format..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <span>Save & Ingest</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter notes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="max-w-3xl mx-auto space-y-3">
          {items.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-slate-800/80 bg-slate-900/20">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No knowledge items found.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click &quot;New Note / Article&quot; to start indexing your research into vector embeddings.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                      {item.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                        item.status === 'READY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.status === 'INDEXING'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.status === 'READY' && <CheckCircle className="w-2.5 h-2.5" />}
                      {item.status === 'INDEXING' && <Clock className="w-2.5 h-2.5" />}
                      {item.status === 'FAILED' && <AlertCircle className="w-2.5 h-2.5" />}
                      <span>{item.status.toLowerCase()}</span>
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 font-mono">
                    <span>{item.wordCount} words</span>
                    <span>•</span>
                    <span>{item.characterCount} chars</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 sm:gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                    title="View & Edit Note"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleReindex(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    title="Re-index embeddings"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for Viewing & Editing Knowledge Item */}
      <KnowledgeModal
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onUpdated={() => loadData(false)}
        onDeleted={() => {
          setSelectedItemId(null);
          loadData(false);
        }}
      />
    </div>
  );
}
