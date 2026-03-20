'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useDocuments } from '@/context/DocumentsContext';
import { useSettings } from '@/context/SettingsContext';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { documents, createDoc } = useDocuments();
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  function runCommand(cmd: () => void) {
    setOpen(false);
    cmd();
  }

  if (!open) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
    >
      <div cmdk-overlay="" />
      <div className="relative z-[10000] bg-white dark:bg-slate-800 border-2 border-ink dark:border-slate-600 rounded-[16px] shadow-hard overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b-2 border-ink/10 dark:border-slate-600">
          <span className="material-symbols-outlined text-ink/40 dark:text-slate-500 mr-2 text-[20px]">search</span>
          <Command.Input
            autoFocus
            placeholder="Search documents or run commands..."
            className="flex-1 py-4 text-base bg-transparent outline-none text-ink dark:text-slate-100 placeholder:text-gray-400 font-body"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded bg-gray-100 dark:bg-slate-700 text-ink/50 dark:text-slate-400 hover:text-ink dark:hover:text-slate-100 text-xs font-mono border border-ink/10 dark:border-slate-600"
          >
            ESC
          </button>
        </div>

        <Command.List className="p-2 overflow-y-auto max-h-[360px] custom-scrollbar">
          <Command.Empty className="py-12 text-center text-sm font-body text-gray-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Actions">
            <Command.Item
              onSelect={() => runCommand(() => router.push('/'))}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Go to Library
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                const doc = createDoc();
                router.push(`/editor?id=${doc.id}`);
              })}
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Create New Document
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/settings'))}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Open Settings
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
              })}
            >
              <span className="material-symbols-outlined text-[18px]">
                {settings.theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              Toggle {settings.theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Command.Item>
          </Command.Group>

          {documents.length > 0 && (
            <Command.Group heading="Recent Documents">
              {documents.slice(0, 10).map((doc) => (
                <Command.Item
                  key={doc.id}
                  value={doc.title || 'Untitled'}
                  onSelect={() => runCommand(() => router.push(`/editor?id=${doc.id}`))}
                >
                  <span className="material-symbols-outlined text-[18px] opacity-70 border-r border-ink/20 pr-2 mr-1">description</span>
                  {doc.title || 'Untitled'}
                  {doc.tags?.length > 0 && (
                    <div className="ml-auto flex gap-1">
                      {doc.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-[9px] bg-ink/5 dark:bg-white/10 rounded uppercase font-bold tracking-wider opacity-60">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
