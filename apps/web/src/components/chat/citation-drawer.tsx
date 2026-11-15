'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Bookmark, CheckCircle2 } from 'lucide-react';

export function CitationDrawer() {
  const { selectedCitation, isCitationDrawerOpen, setCitationDrawerOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCitationDrawerOpen) {
        setCitationDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCitationDrawerOpen, setCitationDrawerOpen]);

  if (!isCitationDrawerOpen || !selectedCitation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm sm:hidden animate-in fade-in duration-200"
        onClick={() => setCitationDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className="w-full sm:w-80 max-w-[90vw] border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between h-full relative z-50 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Verified Evidence</h2>
            </div>
            <button
              onClick={() => setCitationDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Close evidence drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Metadata pill */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Citation #{selectedCitation.rank}
              </span>
              <span className="text-slate-400">
                RRF Score: <strong className="text-emerald-400 font-mono">{selectedCitation.score}</strong>
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Source Item
              </label>
              <h3 className="text-sm font-medium text-slate-200 mt-1">
                {selectedCitation.itemTitle}
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Grounded Chunk Snippet
              </label>
              <div className="mt-2 p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 font-mono leading-relaxed max-h-80 sm:max-h-96 overflow-y-auto whitespace-pre-wrap">
                {selectedCitation.snippet}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <p className="leading-tight text-[11px]">
            This text chunk was directly retrieved from your private knowledge vault using hybrid similarity ranking.
          </p>
        </div>
      </aside>
    </div>
  );
}
