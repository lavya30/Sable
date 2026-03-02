'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SableDocument, CoverColor } from '@/lib/types';
import { extractTextPreview, relativeTime } from '@/lib/documents';
import { useDocuments } from '@/context/DocumentsContext';
import { DocumentMenu } from './DocumentMenu';

const COVER_BG: Record<CoverColor, string> = {
  mint:     'bg-mint',
  lavender: 'bg-lavender',
  peach:    'bg-peach',
  rose:     'bg-rose',
};

const COVER_DOT: Record<CoverColor, string> = {
  mint:     'bg-mint',
  lavender: 'bg-lavender',
  peach:    'bg-peach',
  rose:     'bg-rose',
};

// Decorative SVG doodles per cover colour
const COVER_DOODLE: Record<CoverColor, React.ReactNode> = {
  mint: (
    <svg className="w-full h-full opacity-25" fill="none" viewBox="0 0 100 60">
      <path d="M10 10H90M10 20H80M10 30H85M10 40H60" stroke="#2D3436" strokeLinecap="round" strokeWidth="2" />
    </svg>
  ),
  lavender: (
    <svg className="w-full h-full opacity-25" fill="none" viewBox="0 0 100 60">
      <circle cx="30" cy="30" r="15" stroke="#2D3436" strokeWidth="2" />
      <path d="M60 20L80 40M60 40L80 20" stroke="#2D3436" strokeLinecap="round" strokeWidth="2" />
    </svg>
  ),
  peach: (
    <svg className="w-full h-full opacity-25" fill="none" viewBox="0 0 100 60">
      <rect height="20" rx="2" stroke="#2D3436" strokeWidth="2" width="20" x="20" y="10" />
      <rect height="20" rx="2" stroke="#2D3436" strokeWidth="2" width="20" x="50" y="10" />
      <rect height="10" rx="2" stroke="#2D3436" strokeWidth="2" width="50" x="20" y="40" />
    </svg>
  ),
  rose: (
    <div className="w-full h-full flex items-center justify-center">
      <span className="material-symbols-outlined text-6xl text-ink opacity-25">favorite</span>
    </div>
  ),
};

interface Props {
  doc: SableDocument;
}

export function DocumentCard({ doc }: Props) {
  const router = useRouter();
  const { renameDoc } = useDocuments();
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(doc.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  // Keep input in sync if doc changes externally
  useEffect(() => {
    if (!renaming) setTitleInput(doc.title);
  }, [doc.title, renaming]);

  function commitRename() {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== doc.title) {
      renameDoc(doc.id, trimmed);
    } else {
      setTitleInput(doc.title);
    }
    setRenaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setTitleInput(doc.title);
      setRenaming(false);
    }
  }

  const preview = extractTextPreview(doc.content);

  return (
    <div
      className="group h-[320px] bg-white border-2 border-ink rounded-notebook shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all relative flex flex-col cursor-pointer"
      onClick={() => !renaming && router.push(`/editor?id=${doc.id}`)}
    >
      {/* Three-dot menu – outside overflow-hidden cover so dropdown isn't clipped */}
      <div
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DocumentMenu doc={doc} onRenameStart={() => setRenaming(true)} />
      </div>

      {/* Cover */}
      <div
        className={`h-40 ${COVER_BG[doc.coverColor]} border-b-2 border-ink relative notebook-spine p-4 flex-shrink-0 overflow-hidden rounded-t-[calc(0.75rem-2px)]`}
      >
        {/* Favourite star */}
        {doc.isFavorited && (
          <div className="absolute top-3 left-3">
            <span className="material-symbols-outlined text-ink text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
        )}

        {COVER_DOODLE[doc.coverColor]}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-grow justify-between bg-white">
        <div>
          {renaming ? (
            <input
              ref={inputRef}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="font-heading text-xl text-ink leading-tight mb-2 w-full border-b-2 border-ink outline-none bg-transparent"
            />
          ) : (
            <h3 className="font-heading text-xl text-ink leading-tight mb-2 line-clamp-2">
              {doc.title}
            </h3>
          )}

          {preview ? (
            <p className="font-body text-sm text-gray-500 line-clamp-3">
              {preview}
            </p>
          ) : (
            <p className="font-marker text-sm text-gray-400 italic">
              Empty notebook…
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
            {relativeTime(doc.updatedAt)}
          </span>
          <div
            className={`w-2.5 h-2.5 rounded-full ${COVER_DOT[doc.coverColor]} border border-ink`}
          />
        </div>
      </div>
    </div>
  );
}
