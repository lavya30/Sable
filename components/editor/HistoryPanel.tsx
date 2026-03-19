'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Snapshot, loadSnapshots, clearHistory, relativeSnapshotTime } from '@/lib/history';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  editor: Editor | null;
  onRestore: (content: string) => void;
}

export function HistoryPanel({ isOpen, onClose, docId, editor, onRestore }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Snapshot | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const reload = () => {
      const loaded = loadSnapshots(docId);
      setSnapshots(loaded);
    };
    reload();
    setSelected(loadSnapshots(docId)[0] ?? null);
    setConfirmClear(false);
    const interval = setInterval(reload, 3000);
    return () => clearInterval(interval);
  }, [isOpen, docId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleRestore(snap: Snapshot) {
    try {
      editor?.commands.setContent(JSON.parse(snap.content));
    } catch {
      editor?.commands.setContent(snap.content);
    }
    onRestore(snap.content);
    onClose();
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory(docId);
    setSnapshots([]);
    setSelected(null);
    setConfirmClear(false);
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-ink/20 z-40 cursor-pointer" onClick={onClose} />
      )}

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white border-l-2 border-ink shadow-[-4px_0_0_#2D3436] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="absolute inset-0 bg-dot-grid-sketch opacity-[0.04] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink/10 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-ink">Version History</h2>
            <span className="text-sm font-marker text-gray-500 inline-block">Max 25 snapshots saved per document</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-ink/20 hover:border-ink hover:bg-gray-100 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
              <span className="material-symbols-outlined text-5xl text-gray-300">history</span>
              <p className="font-display font-bold text-ink text-lg">No snapshots yet</p>
              <p className="font-marker text-gray-400 text-sm">Snapshots are saved every 5 minutes while you write</p>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => setSelected(snap)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                    selected?.id === snap.id ? 'bg-lavender/30 border-l-4 border-lavender' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display font-bold text-sm text-ink">{relativeSnapshotTime(snap.savedAt)}</span>
                      <span className="text-[11px] font-marker text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{snap.wordCount} words</span>
                    </div>
                    <p className="text-xs text-gray-400 font-body line-clamp-2 leading-relaxed">
                      {snap.preview || 'Empty document'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestore(snap); }}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-ink text-white text-xs font-marker rounded-lg border-2 border-ink hover:bg-primary hover:text-ink transition-all mt-0.5"
                    title="Restore this version"
                  >
                    <span className="material-symbols-outlined text-[14px]">undo</span>
                    Undo to here
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected snapshot preview + restore */}
        {selected && (
          <div className="border-t-2 border-ink/10 px-5 py-4 relative z-10 bg-white">
            <div className="mb-3">
              <p className="text-xs text-gray-400 font-marker mb-1">
                {new Date(selected.savedAt).toLocaleString([], {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
              <p className="text-sm text-ink/80 font-body line-clamp-3 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-ink/10">
                {selected.preview || 'Empty document'}
              </p>
            </div>
            <button
              onClick={() => handleRestore(selected)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white font-display font-bold text-sm rounded-rough border-2 border-ink hover:bg-primary hover:text-ink transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">restore</span>
              Restore this version
            </button>
          </div>
        )}

        {/* Footer — clear history */}
        {snapshots.length > 0 && (
          <div className="border-t border-ink/10 px-5 py-3 relative z-10">
            <button
              onClick={handleClear}
              className={`text-xs font-marker transition-colors ${confirmClear ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-red-400'}`}
            >
              {confirmClear ? 'Tap again to confirm clear all history' : 'Clear all history'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
