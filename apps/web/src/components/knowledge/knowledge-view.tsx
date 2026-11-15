'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { KnowledgeItemSummary, CollectionSummary } from '@mindvault/shared';
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
  FolderPlus,
  Eye,
} from 'lucide-react';

export function KnowledgeView() {
  const [items, setItems] = useState<KnowledgeItemSummary[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
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
      const [itemsRes, collectionsRes] = await Promise.all([
        apiRequest<{ items: KnowledgeItemSummary[] }>(
          `/knowledge${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`,
        ),
        apiRequest<CollectionSummary[]>('/collections'),
      ]);
      setItems(itemsRes.items || []);
      setCollections(collectionsRes || []);
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
          collectionId: selectedCollectionId || undefined,
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
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">Knowledge Vault Library</h1>
          <span className="text-xs text-slate-500 font-mono">({items.length} items)</span>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreating ? 'Cancel' : 'New Note / Article'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Creator Form */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 backdrop-blur space-y-4 max-w-3xl mx-auto shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Save New Knowledge</span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>{charCount} chars</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Note title or document topic..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">No Collection</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={8}
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
                  <span>Save & Ingest into Vault</span>
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
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No knowledge items saved yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-3 text-xs text-indigo-400 hover:underline"
              >
                Add your first note or paste an article
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/90 hover:border-indigo-500/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    {item.status === 'READY' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Ready</span>
                      </span>
                    )}
                    {item.status === 'INDEXING' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Indexing</span>
                      </span>
                    )}
                    {item.status === 'FAILED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-mono">
                    {item.wordCount} words • {item.characterCount} chars • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemId(item.id);
                    }}
                    title="View & Edit note"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReindex(item.id);
                    }}
                    title="Re-index item"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    title="Delete item"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
        collections={collections}
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
