'use client';

import { useState } from 'react';
import { ExportFormat, SableDocument } from '@/lib/types';
import { exportHTML, exportMarkdown, exportPDF } from '@/lib/export';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: SableDocument;
  getHTML: () => string;
}

const FORMATS: { key: ExportFormat; label: string; icon: string; bg: string; tilt: string }[] = [
  { key: 'pdf',      label: 'PDF',      icon: 'picture_as_pdf', bg: 'peer-checked:bg-primary',   tilt: 'group-hover:-rotate-2 group-hover:scale-105' },
  { key: 'markdown', label: 'Markdown', icon: 'markdown',       bg: 'peer-checked:bg-lavender',   tilt: 'group-hover:rotate-2 group-hover:scale-105'  },
  { key: 'html',     label: 'HTML',     icon: 'html',           bg: 'peer-checked:bg-peach',      tilt: 'group-hover:-rotate-1 group-hover:scale-105' },
];

export function PublishModal({ isOpen, onClose, doc, getHTML }: Props) {
  const [selected, setSelected] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  async function handleExport() {
    setExporting(true);
    try {
      const html = getHTML();
      if (selected === 'pdf')      exportPDF(doc, html);
      if (selected === 'html')     exportHTML(doc, html);
      if (selected === 'markdown') await exportMarkdown(doc, html);
      onClose();
    } finally {
      setExporting(false);
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] bg-white border-[3px] border-ink rounded-wobble shadow-hard-lg flex flex-col p-8 md:p-12 z-10">
        {/* Decorative corners */}
        <div className="absolute -top-3 -left-3 -z-10">
          <svg fill="none" height="60" width="60" viewBox="0 0 60 60">
            <path d="M10 50 C 10 20, 20 10, 50 10" fill="none" stroke="#13ec75" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
        <div className="absolute -bottom-2 -right-2 -z-10">
          <svg fill="none" height="40" width="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" fill="#DDD6FE" r="15" />
          </svg>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl text-ink">close</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mb-2 tracking-tight">
            Ready to publish?
          </h2>
          <p className="font-marker text-xl text-gray-500">
            Choose your format below to make it real.
          </p>
        </div>

        {/* Format cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {FORMATS.map(({ key, label, icon, bg, tilt }) => (
            <label
              key={key}
              className="group relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-ink bg-white shadow-hard-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-hard"
            >
              <input
                type="radio"
                name="export-format"
                value={key}
                checked={selected === key}
                onChange={() => setSelected(key)}
                className="sr-only peer"
              />
              <div
                className={`absolute inset-0 rounded-xl transition-all ${bg} peer-checked:shadow-none peer-checked:translate-x-[2px] peer-checked:translate-y-[2px] ${tilt}`}
              />
              <span className="material-symbols-outlined text-4xl mb-2 text-ink relative z-10">
                {icon}
              </span>
              <span className="font-display font-bold text-lg text-ink relative z-10">
                {label}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="relative w-full py-4 bg-ink text-white font-display font-bold text-xl rounded-lg shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-primary hover:text-ink transition-all border-2 border-ink flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <span className="material-symbols-outlined animate-spin">
                  progress_activity
                </span>
                Exporting…
              </>
            ) : (
              <>
                Make it Real
                <span className="material-symbols-outlined text-2xl">
                  arrow_forward
                </span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="font-marker text-lg text-gray-500 hover:text-ink underline decoration-wavy decoration-gray-300 hover:decoration-ink underline-offset-4 transition-all"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
