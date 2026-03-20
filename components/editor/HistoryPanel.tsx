'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Snapshot, loadSnapshots, clearHistory, relativeSnapshotTime, extractPlainText } from '@/lib/history';
import { diffWords } from 'diff';

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
  const [showDiff, setShowDiff] = useState(false);

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
        <div className="fixed inset-0 bg-black/20 z-40 cursor-pointer" onClick={onClose} />
      )}

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 bottom-0 z-50 w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-display font-bold text-ink dark:text-slate-100">History</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors text-ink/70 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Snapshots list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
            {snapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-slate-700">history</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">No snapshots yet. Snapshots save every 5 minutes.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {snapshots.map((snap) => (
                  <button
                    key={snap.id}
                    onClick={() => setSelected(snap)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      selected?.id === snap.id ? 'bg-lavender/20 dark:bg-slate-800 border-l-3 border-lavender' : 'border-l-3 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-ink dark:text-slate-200">{relativeSnapshotTime(snap.savedAt)}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{snap.wordCount} words</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {snap.preview || '(empty)'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview & restore */}
          {selected && (
            <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900">
              {/* Preview text */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selected.preview || '(empty)'}
                </p>
              </div>

              {/* Diff toggle */}
              {editor && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-ink dark:hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showDiff}
                    onChange={(e) => setShowDiff(e.target.checked)}
                    className="w-3.5 h-3.5 accent-ink rounded"
                  />
                  Show changes
                </label>
              )}

              {/* Restore button */}
              <button
                onClick={() => handleRestore(selected)}
                className="w-full px-3 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink/90 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
                Restore
              </button>
            </div>
          )}

          {/* Clear button */}
          {snapshots.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-700 p-3">
              <button
                onClick={handleClear}
                className={`text-xs transition-colors ${
                  confirmClear
                    ? 'font-semibold text-red-500'
                    : 'text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                {confirmClear ? 'Confirm clear all' : 'Clear history'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
