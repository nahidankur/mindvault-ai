'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '@/lib/api-client';
import {
  KnowledgeItemDetail,
  CollectionSummary,
} from '@mindvault/shared';
import {
  X,
  Edit3,
  Eye,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trash2,
  Calendar,
  Layers,
  FileText,
  Save,
  Check,
} from 'lucide-react';

interface KnowledgeModalProps {
  itemId: string | null;
  collections: CollectionSummary[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: (id: string) => void;
}

export function KnowledgeModal({
  itemId,
  collections,
  onClose,
  onUpdated,
  onDeleted,
}: KnowledgeModalProps) {
  const [item, setItem] = useState<KnowledgeItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'preview' | 'raw'>('preview');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState('');

  const fetchItem = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<KnowledgeItemDetail>(`/knowledge/${id}`);
      setItem(data);
      setTitle(data.title);
      setContent(data.content);
      setCollectionId(data.collectionId || '');
    } catch (err: any) {
      setError(err?.message || 'Could not load knowledge note');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId) {
      setIsEditing(false);
      fetchItem(itemId);
    } else {
      setItem(null);
    }
  }, [itemId, fetchItem]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && itemId) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemId, onClose]);

  if (!itemId) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await apiRequest<KnowledgeItemDetail>(`/knowledge/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          collectionId: collectionId || null,
        }),
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update note');
      setIsSaving(false);
    }
  };

  const handleReindex = async () => {
    if (!item || isReindexing) return;
    setIsReindexing(true);
    try {
      await apiRequest(`/knowledge/${item.id}/reindex`, { method: 'POST' });
      await fetchItem(item.id);
      onUpdated();
    } catch (err: any) {
      alert(`Could not reindex: ${err?.message}`);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('Are you sure you want to permanently delete this note and all its embeddings?')) return;
    try {
      await apiRequest(`/knowledge/${item.id}`, { method: 'DELETE' });
      onDeleted(item.id);
      onClose();
    } catch (err: any) {
      alert(`Could not delete: ${err?.message}`);
    }
  };

  const activeCollection = collections.find((c) => c.id === (item?.collectionId || collectionId));
  const editWordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const editCharCount = content.length;

  return (
    <div
      className="fixed inset-y-0 right-0 left-0 md:left-64 z-30 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-100 truncate">
                {isEditing ? 'Edit Knowledge Note' : item?.title || 'Loading Note...'}
              </h2>
              {item && !isEditing && (
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                  {item.status === 'READY' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  )}
                  {item.status === 'INDEXING' && (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Indexing</span>
                    </span>
                  )}
                  {item.status === 'FAILED' && (
                    <span className="inline-flex items-center gap-1 text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Failed</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>{item.wordCount} words</span>
                  <span>•</span>
                  <span>{item.characterCount} chars</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {item && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-sm font-mono">Loading knowledge details...</p>
            </div>
          ) : isEditing ? (
            /* Edit Form */
            <form id="edit-knowledge-form" onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-300">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Collection</label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Content (Markdown)</label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {editWordCount} words • {editCharCount} chars
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter knowledge content..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  required
                />
              </div>
            </form>
          ) : item ? (
            /* View Mode */
            <div className="space-y-6">
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {activeCollection && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{activeCollection.name}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.updatedAt !== item.createdAt && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/40 text-slate-400">
                    <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Preview / Raw Mode Toggle */}
                <div className="ml-auto flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewTab('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      viewTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Formatted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('raw')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      viewTab === 'raw'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Raw Markdown</span>
                  </button>
                </div>
              </div>

              {/* Content Viewer */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 text-slate-200">
                {viewTab === 'preview' ? (
                  <div className="prose prose-invert prose-indigo max-w-none text-sm leading-relaxed space-y-3 font-sans">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-300 leading-relaxed selection:bg-indigo-500/30">
                    {item.content}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (item) {
                    setTitle(item.title);
                    setContent(item.content);
                    setCollectionId(item.collectionId || '');
                  }
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-knowledge-form"
                disabled={isSaving || !title.trim() || !content.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving & Ingesting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Re-index</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReindex}
                  disabled={isReindexing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition border border-slate-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
                  <span>Re-index Chunks</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
