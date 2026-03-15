'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDocuments } from '@/context/DocumentsContext';
import { LibraryTab, SortOrder } from '@/lib/types';
import { DocumentCard } from '@/components/library/DocumentCard';
import { NewDocumentCard } from '@/components/library/NewDocumentCard';
import { exportAllData, importAllData } from '@/lib/backup';
import gsap from 'gsap';

export default function LibraryPage() {
  const { documents } = useDocuments();
  const [tab, setTab] = useState<LibraryTab>('recent');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const gridRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError('');
      await importAllData(file);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    e.target.value = '';
  }

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
  }, [tab, sortOrder, search, isClient, documents.length]);

  const filtered = useMemo(() => {
    let list = documents.filter((d) => !d.isDeleted);

    if (tab === 'favorites') list = list.filter((d) => d.isFavorited);
    else if (tab === 'archived') list = list.filter((d) => d.isArchived);
    else list = list.filter((d) => !d.isArchived);

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

  const getTabLabel = (t: LibraryTab) => {
    switch (t) {
      case 'recent': return 'All notes';
      case 'favorites': return 'Favorites';
      case 'archived': return 'Archived';
      default: return 'Notes';
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-canvas text-ink font-body selection:bg-mint selection:text-ink overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r-2 border-ink/5 bg-gray-50/50">
        <div className="p-6 pb-2 flex-1 overflow-y-auto custom-scrollbar">
          {/* User Profile */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-ink flex items-center justify-center text-xl overflow-hidden shadow-sm">
              <span className="material-symbols-outlined text-ink">face_5</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold text-ink leading-tight">Writer</span>
              <span className="text-xs text-gray-500 font-mono">writer@sable.app</span>
            </div>
          </div>

          <div className="space-y-8">
            {/* MAIN Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Main</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setTab('recent')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === 'recent' 
                      ? 'bg-white shadow-sm ring-1 ring-ink/5 text-ink' 
                      : 'text-gray-500 hover:bg-black/5 hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] filled-icon">description</span>
                  All notes
                </button>
                <button
                  onClick={() => setTab('favorites')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === 'favorites' 
                      ? 'bg-white shadow-sm ring-1 ring-ink/5 text-ink' 
                      : 'text-gray-500 hover:bg-black/5 hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] filled-icon">bookmark</span>
                  Favorites
                </button>
              </nav>
            </div>

            {/* ORDER Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Order</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setTab('archived')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === 'archived' 
                      ? 'bg-white shadow-sm ring-1 ring-ink/5 text-ink' 
                      : 'text-gray-500 hover:bg-black/5 hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">archive</span>
                  Archived
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* SETTINGS Section (pinned to bottom) */}
        <div className="p-6 pt-0 mt-auto">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Settings</h3>
            <Link
              href="/settings"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all text-gray-500 hover:bg-black/5 hover:text-ink"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </Link>
             {/* Import / Export moved here */}
             <button
              onClick={exportAllData}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all text-gray-500 hover:bg-black/5 hover:text-ink"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export Data
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all text-gray-500 hover:bg-black/5 hover:text-ink"
            >
              <span className="material-symbols-outlined text-[20px]">upload</span>
              Import Data
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            {importError && (
              <p className="text-xs text-rose px-3 mt-1">{importError}</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header */}
        <header className="flex-shrink-0 px-8 py-6 border-b border-ink/5 flex flex-col gap-6">
          {/* Breadcrumb + Search Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                <span className="hover:text-ink cursor-pointer transition-colors">Home</span>
                <span>/</span>
                <span className="text-ink">{getTabLabel(tab)}</span>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
                 {/* Search */}
                <div className="relative w-full max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">
                    search
                    </span>
                    <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search a note"
                    className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white text-ink text-sm px-4 py-2.5 pl-10 border border-transparent focus:border-ink/20 rounded-lg transition-all outline-none placeholder:text-gray-400"
                    />
                     {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 w-full max-w-7xl mx-auto">
            {/* Show New Document Card only in 'All notes' (recent) tab when not searching */}
            {tab === 'recent' && !search && (
              <div className="col-span-1">
                  <NewDocumentCard />
              </div>
            )}

            {filtered.map((doc) => (
              <div key={doc.id} className="col-span-1">
                 <DocumentCard doc={doc} />
              </div>
            ))}
            
            {filtered.length === 0 && !search && tab !== 'recent' && (
              <div className="col-span-full py-20 text-center">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-300">folder_off</span>
                 </div>
                <p className="text-gray-400 font-medium">No documents found in {getTabLabel(tab)}</p>
              </div>
            )}
            
            {filtered.length === 0 && search && (
              <div className="col-span-full py-20 text-center">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-300">search_off</span>
                 </div>
                <p className="text-gray-400 font-medium">No results for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
