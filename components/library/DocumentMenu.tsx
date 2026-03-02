'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocuments } from '@/context/DocumentsContext';
import { SableDocument } from '@/lib/types';

interface Props {
  doc: SableDocument;
  onRenameStart: () => void;
}

export function DocumentMenu({ doc, onRenameStart }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteDoc, duplicateDoc, toggleFavorite, toggleArchive } =
    useDocuments();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-8 h-8 bg-white border-2 border-ink rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-hard-sm"
        aria-label="Document options"
      >
        <span className="material-symbols-outlined text-lg">more_horiz</span>
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 w-44 bg-white border-2 border-ink rounded-lg shadow-hard overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onRenameStart();
            }}
            className="w-full text-left px-4 py-2 text-sm font-body hover:bg-lavender/50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Rename
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              duplicateDoc(doc.id);
            }}
            className="w-full text-left px-4 py-2 text-sm font-body hover:bg-mint/50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              content_copy
            </span>
            Duplicate
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              toggleFavorite(doc.id);
            }}
            className="w-full text-left px-4 py-2 text-sm font-body hover:bg-peach/50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              {doc.isFavorited ? 'heart_minus' : 'favorite'}
            </span>
            {doc.isFavorited ? 'Unfavorite' : 'Favorite'}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              toggleArchive(doc.id);
            }}
            className="w-full text-left px-4 py-2 text-sm font-body hover:bg-lavender/50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              {doc.isArchived ? 'unarchive' : 'archive'}
            </span>
            {doc.isArchived ? 'Unarchive' : 'Archive'}
          </button>

          <div className="border-t border-gray-100" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              deleteDoc(doc.id);
            }}
            className="w-full text-left px-4 py-2 text-sm font-body hover:bg-rose/50 text-red-600 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
