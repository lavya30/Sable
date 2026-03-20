'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
  onSketchpadToggle: () => void;
  onMoodBoardToggle: () => void;
  onOutlineToggle: () => void;
  onFindToggle: () => void;
  onPublishOpen: () => void;
  onHistoryOpen: () => void;
  focusMode: boolean;
  showPreview: boolean;
  onPreviewToggle: () => void;
  docTitle: string;
}

const FONTS: { css: string; label: string }[] = [
  { css: '', label: 'Default' },
  { css: 'Georgia, serif', label: 'Georgia' },
  { css: 'var(--font-lora), serif', label: 'Lora' },
  { css: 'var(--font-merriweather), serif', label: 'Merriweather' },
  { css: 'var(--font-patrick-hand), cursive', label: 'Patrick Hand' },
  { css: 'var(--font-caveat), cursive', label: 'Caveat' },
  { css: 'var(--font-kalam), cursive', label: 'Kalam' },
  { css: 'var(--font-special-elite), cursive', label: 'Special Elite' },
  { css: 'var(--font-fira-code), monospace', label: 'Fira Code' },
];

export function EditorToolbar({
  editor,
  onSketchpadToggle,
  onMoodBoardToggle,
  onOutlineToggle,
  onFindToggle,
  onPublishOpen,
  onHistoryOpen,
  focusMode,
  showPreview,
  onPreviewToggle,
  docTitle,
}: Props) {
  const [fontOpen, setFontOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [tableOpen, setTableOpen] = useState(false);
  const [tableHover, setTableHover] = useState({ rows: 0, cols: 0 });
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const imageDropdownRef = useRef<HTMLDivElement>(null);
  const tableDropdownRef = useRef<HTMLDivElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const activeFamily = editor?.getAttributes('textStyle')?.fontFamily ?? '';
  const currentFont = FONTS.find((f) => f.css === activeFamily) ?? FONTS[0];

  useEffect(() => {
    if (!fontOpen && !imageOpen && !tableOpen) return;
    const handler = (e: MouseEvent) => {
      if (fontOpen && !fontDropdownRef.current?.contains(e.target as Node)) setFontOpen(false);
      if (imageOpen && !imageDropdownRef.current?.contains(e.target as Node)) setImageOpen(false);
      if (tableOpen && !tableDropdownRef.current?.contains(e.target as Node)) setTableOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fontOpen, imageOpen, tableOpen]);

  function insertImageUrl() {
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().insertContent({
      type: 'image',
      attrs: { src: imageUrl.trim() },
    }).run();
    setImageUrl('');
    setImageOpen(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src },
      }).run();
      setImageOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  if (!editor) return null;

  const IconBtn = ({
    icon,
    label,
    onClick,
    active = false,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
  }) => (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        aria-label={label}
        className={`p-2 rounded-lg transition-all duration-200 ${
          active
            ? 'text-ink dark:text-slate-100 font-medium'
            : 'text-ink/50 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-primary/10 dark:hover:bg-slate-800'
        }`}
      >
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </button>
      {/* Hover tooltip box — above button with arrow */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-ink dark:bg-slate-800 text-canvas dark:text-slate-100 text-xs font-semibold rounded-lg shadow-lg opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all duration-200 whitespace-nowrap pointer-events-none border border-ink/20 dark:border-slate-700 z-50">
        {label}
        {/* Arrow pointing down */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-ink dark:border-t-slate-800" />
      </div>
      {/* Inline label — below tooltip */}
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1.5 bg-ink dark:bg-slate-800 text-canvas dark:text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all duration-200 pointer-events-none border border-ink/20 dark:border-slate-700 z-50 shadow-md">
        {label}
      </span>
    </div>
  );

  return (
    <>
      {/* Top toolbar — always visible, minimal */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-canvas dark:bg-slate-950 border-b border-ink/8 dark:border-slate-800/50 backdrop-blur-sm ${
          focusMode ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between h-14 px-5 gap-5">
          {/* Left: Back & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-70 transition-opacity min-w-0 group"
            title="Back to Library"
          >
            <span className="material-symbols-outlined text-base text-primary dark:text-primary/70 group-hover:text-primary/80">arrow_back</span>
            <span className="font-medium text-sm text-ink dark:text-slate-100 truncate hidden sm:block max-w-[200px]">
              {docTitle || 'Untitled'}
            </span>
          </Link>

          {/* Center: Format tools */}
          <div className="flex items-center gap-0.5">
            <IconBtn
              icon="format_bold"
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            />
            <IconBtn
              icon="format_italic"
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            />
            <IconBtn
              icon="format_h1"
              label="Heading 1"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
            />
            <IconBtn
              icon="format_h2"
              label="Heading 2"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
            />
            <IconBtn
              icon="format_quote"
              label="Quote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
            />
            <div className="w-px h-5 bg-ink/10 dark:bg-slate-800 mx-2" />
            <IconBtn
              icon="format_list_bulleted"
              label="Bullet List"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
            />
            <IconBtn
              icon="format_list_numbered"
              label="Numbered List"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
            />
            <IconBtn
              icon="highlight"
              label="Highlight"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
            />
          </div>

          {/* Right: Tools & Actions */}
          <div className="flex items-center gap-0.5">
            {/* Font */}
            <div ref={fontDropdownRef} className="relative">
              <IconBtn
                icon="font_download"
                label="Font"
                onClick={() => {
                  setFontOpen(!fontOpen);
                  setImageOpen(false);
                  setTableOpen(false);
                }}
                active={fontOpen}
              />
              {fontOpen && (
                <div className="absolute top-full right-0 mt-2 z-[60] bg-canvas dark:bg-slate-900 border border-ink/20 dark:border-slate-800 rounded-xl shadow-lg min-w-[160px] overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {FONTS.map((font) => (
                      <button
                        key={font.css}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (font.css === '') {
                            editor.chain().focus().unsetFontFamily().run();
                          } else {
                            editor.chain().focus().setFontFamily(font.css).run();
                          }
                          setFontOpen(false);
                        }}
                        className={`w-full text-left text-sm px-4 py-2.5 hover:bg-primary/10 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                          font.css === activeFamily ? 'bg-lavender/20 dark:bg-slate-800/50 text-ink dark:text-slate-50 font-medium' : 'text-ink/70 dark:text-slate-300'
                        }`}
                        style={{ fontFamily: font.css || undefined }}
                      >
                        <span>{font.label}</span>
                        {font.css === activeFamily && (
                          <span className="material-symbols-outlined text-sm text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Image */}
            <div ref={imageDropdownRef} className="relative">
              <IconBtn
                icon="image"
                label="Image"
                onClick={() => {
                  setImageOpen(!imageOpen);
                  setFontOpen(false);
                  setTableOpen(false);
                }}
                active={imageOpen}
              />
              {imageOpen && (
                <div className="absolute top-full right-0 mt-2 z-[60] bg-canvas dark:bg-slate-900 border border-ink/20 dark:border-slate-800 rounded-xl shadow-lg w-72 p-4 space-y-3">
                  <div className="text-xs font-medium text-ink/60 dark:text-slate-400 uppercase tracking-wide">URL</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && insertImageUrl()}
                      placeholder="Paste URL…"
                      className="flex-1 text-sm border border-ink/20 dark:border-slate-700 rounded-lg px-3 py-2 bg-canvas dark:bg-slate-800 text-ink dark:text-slate-100 placeholder:text-ink/40 focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      onClick={insertImageUrl}
                      disabled={!imageUrl.trim()}
                      className="px-3 py-2 bg-primary text-ink rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink/40">
                    <div className="flex-1 h-px bg-ink/10" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-ink/10" />
                  </div>
                  <button
                    onClick={() => imageFileRef.current?.click()}
                    className="w-full text-sm border border-dashed border-ink/20 dark:border-slate-700 rounded-lg px-3 py-2.5 text-ink/60 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:border-ink/40 transition-all"
                  >
                    Upload file
                  </button>
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>

            {/* Table */}
            <div ref={tableDropdownRef} className="relative">
              <IconBtn
                icon="table"
                label="Table"
                onClick={() => {
                  setTableOpen(!tableOpen);
                  setFontOpen(false);
                  setImageOpen(false);
                }}
                active={tableOpen}
              />
              {tableOpen && (
                <div className="absolute top-full right-0 mt-2 z-[60] bg-canvas dark:bg-slate-900 border border-ink/20 dark:border-slate-800 rounded-xl shadow-lg p-4">
                  <div className="text-xs font-medium text-ink/60 dark:text-slate-400 uppercase tracking-wide mb-3">Table size</div>
                  <div
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                    onMouseLeave={() => setTableHover({ rows: 0, cols: 0 })}
                  >
                    {Array.from({ length: 36 }, (_, i) => {
                      const row = Math.floor(i / 6) + 1;
                      const col = (i % 6) + 1;
                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setTableHover({ rows: row, cols: col })}
                          onClick={() => {
                            editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run();
                            setTableOpen(false);
                            setTableHover({ rows: 0, cols: 0 });
                          }}
                          className={`w-6 h-6 border rounded-md cursor-pointer transition-all ${
                            row <= tableHover.rows && col <= tableHover.cols
                              ? 'bg-primary border-primary'
                              : 'bg-surface dark:bg-slate-800 border-ink/20 dark:border-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  {tableHover.rows > 0 && (
                    <div className="text-xs text-ink/60 dark:text-slate-400 mt-3 text-center">
                      {tableHover.rows} × {tableHover.cols}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-ink/10 dark:bg-slate-800 mx-2" />

            {/* View toggles */}
            <IconBtn
              icon={showPreview ? 'visibility_off' : 'visibility'}
              label="Preview"
              onClick={onPreviewToggle}
              active={showPreview}
            />
            <IconBtn
              icon="toc"
              label="Outline"
              onClick={onOutlineToggle}
            />
            <IconBtn
              icon="search"
              label="Find"
              onClick={onFindToggle}
            />

            <div className="w-px h-5 bg-ink/10 dark:bg-slate-800 mx-2" />

            {/* Panels */}
            <IconBtn
              icon="draw"
              label="Sketchpad"
              onClick={onSketchpadToggle}
            />
            <IconBtn
              icon="dashboard"
              label="Mood Board"
              onClick={onMoodBoardToggle}
            />
            <IconBtn
              icon="history"
              label="History"
              onClick={onHistoryOpen}
            />

            <div className="w-px h-5 bg-ink/10 dark:bg-slate-800 mx-2" />

            {/* Publish */}
            <div className="relative group/btn">
              <button
                onClick={onPublishOpen}
                className="px-4 py-2 bg-primary text-ink rounded-lg hover:bg-primary/90 transition-all text-sm font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">publish</span>
                <span className="hidden sm:inline">Publish</span>
              </button>
              {/* Hover tooltip box */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-ink dark:bg-slate-800 text-canvas dark:text-slate-100 text-xs font-semibold rounded-lg shadow-lg opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all duration-200 whitespace-nowrap pointer-events-none border border-ink/20 dark:border-slate-700 z-50">
                Export / Publish
                {/* Arrow pointing down */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-ink dark:border-t-slate-800" />
              </div>
              {/* Inline label */}
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1.5 bg-ink dark:bg-slate-800 text-canvas dark:text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all duration-200 pointer-events-none border border-ink/20 dark:border-slate-700 z-50 shadow-md">
                Export / Publish
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
