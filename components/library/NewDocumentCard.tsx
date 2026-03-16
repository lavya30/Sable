'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useDocuments } from '@/context/DocumentsContext';

export function NewDocumentCard() {
  const router = useRouter();
  const { createDoc, renameDoc } = useDocuments();
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function openDialog() {
    setName('');
    setShowDialog(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleCreate() {
    const title = name.trim() || 'Untitled';
    const doc = createDoc();
    renameDoc(doc.id, title);
    router.push(`/editor?id=${doc.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setShowDialog(false);
  }

  return (
    <>
      {/* Card */}
      <div
        onClick={openDialog}
        className="group h-[320px] bg-white dark:bg-slate-700 wobbly-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 card-lift wiggle-hover border-2 border-ink/20 dark:border-slate-600"
      >
        <div className="w-16 h-16 rounded-full bg-mint dark:bg-emerald-600 flex items-center justify-center border-2 border-ink dark:border-slate-200 shadow-hard group-hover:shadow-hard-hover group-hover:-translate-y-1 transition-all">
          <span className="material-symbols-outlined text-4xl text-ink dark:text-slate-100">add</span>
        </div>
        <h3 className="font-heading text-xl mt-4 text-ink dark:text-slate-100">New Notebook</h3>
        <p className="font-marker text-gray-700 dark:text-gray-300">Start fresh</p>
      </div>

      {/* Name dialog */}
      {showDialog && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30 dark:bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowDialog(false)}
        >
          <div className="bg-white dark:bg-slate-800 border-2 border-ink dark:border-slate-600 rounded-notebook shadow-hard-lg w-full max-w-md mx-4 overflow-hidden animate-[slide-down_0.2s_ease]">
            {/* Header stripe */}
            <div className="bg-mint dark:bg-emerald-600 border-b-2 border-ink dark:border-slate-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-gray-900">Name your notebook</h2>
                <p className="font-marker text-sm text-gray-900 -rotate-1 inline-block">Every great story starts with a title</p>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="w-9 h-9 rounded-full border-2 border-ink dark:border-slate-400 bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors shadow-hard-sm"
              >
                <span className="material-symbols-outlined text-lg text-ink dark:text-slate-100">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex flex-col gap-4">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. My Novel, Journal 2026…"
                maxLength={80}
                className="w-full border-2 border-ink dark:border-slate-600 rounded-lg px-4 py-3 font-body text-base text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(19,236,117,0.25)] transition-all bg-white dark:bg-slate-700"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-5 py-2.5 rounded-lg border-2 border-ink dark:border-slate-400 font-body text-sm text-ink dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-hard-sm hover:shadow-hard-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 rounded-lg border-2 border-ink dark:border-slate-400 bg-mint dark:bg-emerald-500 font-body text-sm font-semibold text-gray-900 hover:bg-mint/80 dark:hover:bg-emerald-600 transition-colors shadow-hard hover:shadow-hard-hover hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">edit</span>
                    Create Notebook
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
