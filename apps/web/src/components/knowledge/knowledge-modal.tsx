'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '@/lib/api-client';
import { KnowledgeItemDetail } from '@mindvault/shared';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  X,
  Edit3,
  Eye,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trash2,
  Calendar,
  FileText,
  Save,
  Check,
} from 'lucide-react';

interface KnowledgeModalProps {
  itemId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: (id: string) => void;
}

export function KnowledgeModal({
  itemId,
  onClose,
  onUpdated,
  onDeleted,
}: KnowledgeModalProps) {
  const [item, setItem] = useState<KnowledgeItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'preview' | 'raw'>('preview');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchItem = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<KnowledgeItemDetail>(`/knowledge/${id}`);
      setItem(data);
      setTitle(data.title);
      setContent(data.content);
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
    setError(null);
    try {
      await apiRequest(`/knowledge/${item.id}/reindex`, { method: 'POST' });
      await fetchItem(item.id);
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Could not reindex note');
    } finally {
      setIsReindexing(false);
    }
  };

  const confirmDeleteNote = async () => {
    if (!item) return;
    setIsDeletingNote(true);
    try {
      await apiRequest(`/knowledge/${item.id}`, { method: 'DELETE' });
      setShowDeleteConfirm(false);
      onDeleted(item.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not delete note');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingNote(false);
    }
  };

  const editWordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const editCharCount = content.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-2 sm:mr-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                {isEditing ? 'Edit Knowledge Note' : item?.title || 'Knowledge Details'}
              </h2>
              {item && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                  <span>{item.wordCount} words</span>
                  <span>•</span>
                  <span>{item.characterCount} chars</span>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      item.status === 'READY'
                        ? 'text-emerald-400'
                        : item.status === 'INDEXING'
                          ? 'text-indigo-400'
                          : 'text-rose-400'
                    }`}
                  >
                    {item.status === 'READY' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {item.status.toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Edit note"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleReindex}
                  disabled={isReindexing}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                  title="Force re-chunk and vector re-index"
                >
                  <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="submit"
                form="edit-knowledge-form"
                disabled={isSaving || !title.trim() || !content.trim()}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow-sm shadow-indigo-600/30"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Ingest</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-sm font-mono">Loading knowledge details...</p>
            </div>
          ) : isEditing ? (
            /* Edit Form */
            <form id="edit-knowledge-form" onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Content (Markdown)</label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {editWordCount} words • {editCharCount} chars
                  </span>
                </div>
                <textarea
                  rows={9}
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
            <div className="space-y-4 sm:space-y-6">
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.updatedAt !== item.createdAt && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-800/40 text-slate-400">
                    <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Preview / Raw Mode Toggle */}
                <div className="ml-auto flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewTab('preview')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      viewTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="hidden sm:inline">Formatted</span>
                    <span className="sm:hidden">Format</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('raw')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      viewTab === 'raw'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Raw</span>
                  </button>
                </div>
              </div>

              {/* Content Viewer */}
              <div className="p-3.5 sm:p-5 rounded-xl border border-slate-800 bg-slate-950/70 text-slate-200">
                {viewTab === 'preview' ? (
                  <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                    {item.content}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {isEditing ? (
              <span>Saving will trigger background vector re-chunking via BullMQ.</span>
            ) : (
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> to close.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Modern CSS Confirmation Modal for Deletion */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        itemName={item?.title}
        isDeleting={isDeletingNote}
        onConfirm={confirmDeleteNote}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
