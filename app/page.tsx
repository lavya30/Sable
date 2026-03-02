'use client';

import { useState, useMemo } from 'react';
import { useDocuments } from '@/context/DocumentsContext';
import { LibraryTab, SortOrder } from '@/lib/types';
import { DocumentCard } from '@/components/library/DocumentCard';
import { NewDocumentCard } from '@/components/library/NewDocumentCard';

export default function LibraryPage() {
  const { documents } = useDocuments();
  const [tab, setTab] = useState<LibraryTab>('recent');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filtered = useMemo(() => {
    let list = documents.filter((d) => !d.isDeleted);

    if (tab === 'favorites') list = list.filter((d) => d.isFavorited);
    else if (tab === 'archived') list = list.filter((d) => d.isArchived);
    else list = list.filter((d) => !d.isArchived); // recent = non-archived

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });
  }, [documents, tab, search, sortOrder]);

  const tabs: { key: LibraryTab; label: string }[] = [
    { key: 'recent',    label: 'Recent' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'archived',  label: 'Archived' },
  ];

  return (
    <div className="bg-canvas text-ink font-body min-h-screen flex flex-col dot-grid">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Greeting */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-ink">
              edit_note
            </span>
            <div>
              <h1 className="font-heading text-3xl text-ink">
                Welcome back, Writer
              </h1>
              <p className="font-marker text-lg text-gray-500 ml-1">
                Ready to fill a new page?
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your notebooks…"
              className="w-full bg-white text-ink font-marker text-lg px-4 py-3 pl-10 border-2 border-ink rounded-rough focus:outline-none focus:shadow-hard transition-shadow placeholder:text-gray-400"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              search
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          {/* Decorative icons — non-functional per spec */}
          <div className="hidden md:flex items-center gap-4 pointer-events-none select-none opacity-40">
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-ink">
              <span className="material-symbols-outlined text-xl">
                notifications
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-ink bg-peach flex items-center justify-center">
              <span className="material-symbols-outlined text-ink">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 pb-20">
        {/* Tab bar */}
        <div className="flex items-center gap-6 mb-8 border-b-2 border-ink/10 pb-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`font-heading text-lg relative transition-colors ${
                tab === key
                  ? 'text-ink'
                  : 'text-gray-400 hover:text-ink'
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute -bottom-[18px] left-0 w-full h-[3px] bg-ink rounded-full" />
              )}
            </button>
          ))}

          <div className="flex-grow" />

          <button
            onClick={() =>
              setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))
            }
            className="flex items-center gap-1 font-marker text-ink/70 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
            {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tab === 'recent' && !search && <NewDocumentCard />}

          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                {tab === 'favorites'
                  ? 'favorite'
                  : tab === 'archived'
                  ? 'archive'
                  : 'search_off'}
              </span>
              <p className="font-heading text-2xl text-gray-400">
                {search
                  ? 'No notebooks match your search.'
                  : tab === 'favorites'
                  ? 'No favorites yet.'
                  : tab === 'archived'
                  ? 'Nothing archived.'
                  : 'No notebooks yet — create one!'}
              </p>
            </div>
          )}

          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mt-20 text-center opacity-40">
            <span className="font-marker text-lg">
              {filtered.length} notebook{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
