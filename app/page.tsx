'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useDocuments } from '@/context/DocumentsContext';
import { LibraryTab, SortOrder } from '@/lib/types';
import { DocumentCard } from '@/components/library/DocumentCard';
import { NewDocumentCard } from '@/components/library/NewDocumentCard';
import { WritingStatsPanel } from '@/components/library/WritingStatsPanel';
import { exportAllData, importAllData } from '@/lib/backup';
import gsap from 'gsap';

export default function LibraryPage() {
  const { documents } = useDocuments();
  const [tab, setTab] = useState<LibraryTab>('recent');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError('');
      await importAllData(file);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  // GSAP entrance animation
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', overwrite: true }
      );
    }
  }, []);

  // Stagger cards whenever filtered list changes
  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll(':scope > *');
      if (cards.length) {
        gsap.fromTo(cards,
          { y: 25, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out', overwrite: true }
        );
      }
    }
  }, [tab, sortOrder, search]);

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
    { key: 'recent', label: 'Recent' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="bg-canvas text-ink font-body min-h-screen flex flex-col dot-grid">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header ref={headerRef} className="w-full max-w-7xl mx-auto px-6 pt-12 pb-8">
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
            <label htmlFor="library-search" className="sr-only">Search your notebooks</label>
            <input
              id="library-search"
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

          {/* Export / Import */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={exportAllData}
              title="Export all data"
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-ink/20 rounded-rough text-sm font-marker text-ink hover:bg-mint/30 hover:border-ink/40 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              title="Import data from backup"
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-ink/20 rounded-rough text-sm font-marker text-ink hover:bg-lavender/30 hover:border-ink/40 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            {importError && (
              <span className="text-xs font-marker text-red-500 ml-1">{importError}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 pb-20">
        {/* Writing Stats */}
        <WritingStatsPanel />

        {/* Tab bar */}
        <div className="flex items-center gap-6 mb-8 border-b-2 border-ink/10 pb-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`font-heading text-lg relative transition-colors ${tab === key
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
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
