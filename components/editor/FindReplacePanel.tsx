'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export function FindReplacePanel({ isOpen, onClose, editor }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen && editor) {
      editor.commands.setSearchTerm('');
      setSearchTerm('');
      setReplaceTerm('');
    }
  }, [isOpen, editor]);

  useEffect(() => {
    if (!editor || !isOpen) return;
    editor.commands.setSearchTerm(searchTerm);
  }, [searchTerm, editor, isOpen]);

  useEffect(() => {
    if (!editor || !isOpen) return;
    editor.commands.setReplaceTerm(replaceTerm);
  }, [replaceTerm, editor, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 z-50 bg-white border-2 border-ink rounded-xl shadow-hard p-3 w-[320px] flex flex-col gap-3 font-body animate-slide-down">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink/50 ml-1">Find & Replace</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-ink/40 hover:text-ink hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative flex items-center bg-gray-50 border-2 border-ink/20 focus-within:border-primary rounded-lg px-2 overflow-hidden transition-colors">
          <span className="material-symbols-outlined text-[18px] text-ink/40 shrink-0">search</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) editor?.commands.previousSearchResult();
                else editor?.commands.nextSearchResult();
              }
              if (e.key === 'Escape') onClose();
            }}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-gray-400"
          />
          {searchTerm && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => editor?.commands.previousSearchResult()}
                className="p-1 hover:bg-gray-200 rounded text-ink/60 transition-colors"
                title="Previous (Shift+Enter)"
              >
                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
              </button>
              <button
                onClick={() => editor?.commands.nextSearchResult()}
                className="p-1 hover:bg-gray-200 rounded text-ink/60 transition-colors"
                title="Next (Enter)"
              >
                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center bg-gray-50 border-2 border-ink/20 focus-within:border-peach rounded-lg px-2 overflow-hidden transition-colors">
          <span className="material-symbols-outlined text-[18px] text-ink/40 shrink-0">find_replace</span>
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                editor?.commands.replace();
              }
              if (e.key === 'Escape') onClose();
            }}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-1">
        <button
          onClick={() => editor?.commands.replace()}
          disabled={!searchTerm}
          className="px-3 py-1.5 bg-white border-2 border-ink text-ink text-xs font-bold rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
        >
          Replace
        </button>
        <button
          onClick={() => editor?.commands.replaceAll()}
          disabled={!searchTerm}
          className="px-3 py-1.5 bg-ink border-2 border-ink text-white text-xs font-bold rounded-md hover:bg-primary hover:text-ink disabled:opacity-40 transition-all shadow-sm"
        >
          Replace All
        </button>
      </div>
    </div>
  );
}
