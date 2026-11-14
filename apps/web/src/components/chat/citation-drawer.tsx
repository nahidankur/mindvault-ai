'use client';

import { useAppStore } from '@/lib/store';
import { X, ExternalLink, Bookmark, CheckCircle2, ShieldAlert } from 'lucide-react';

export function CitationDrawer() {
  const { selectedCitation, isCitationDrawerOpen, setCitationDrawerOpen } = useAppStore();

  if (!isCitationDrawerOpen || !selectedCitation) {
    return null;
  }

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950/90 backdrop-blur-md p-5 flex flex-col justify-between h-screen fixed right-0 top-0 z-40 shadow-2xl transition-all">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Verified Evidence</h2>
          </div>
          <button
            onClick={() => setCitationDrawerOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
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
            <div className="mt-2 p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 font-mono leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
              {selectedCitation.snippet}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
        <p className="leading-tight text-[11px]">
          This text chunk was directly retrieved from your private knowledge vault using hybrid similarity ranking.
        </p>
      </div>
    </aside>
  );
}
