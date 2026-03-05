'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Editor } from '@tiptap/react';
import gsap from 'gsap';


interface Props {
  editor: Editor | null;
  onSketchpadToggle: () => void;
  onMoodBoardToggle: () => void;
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
  onPublishOpen,
  onHistoryOpen,
  focusMode,
  showPreview,
  onPreviewToggle,
  docTitle,
}: Props) {
  const toolbarInnerRef = useRef<HTMLDivElement>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const imageDropdownRef = useRef<HTMLDivElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const activeFamily = editor?.getAttributes('textStyle')?.fontFamily ?? '';
  const currentFont = FONTS.find((f) => f.css === activeFamily) ?? FONTS[0];

  // GSAP: initial reveal animation for toolbar buttons
  useEffect(() => {
    if (!editor) return;
    const el = toolbarInnerRef.current;
    if (!el) return;
    const buttons = el.querySelectorAll('button, a');
    gsap.fromTo(buttons,
      { y: -8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power3.out', delay: 0.3, overwrite: true }
    );
  }, [editor]);

  useEffect(() => {
    if (!fontOpen && !imageOpen) return;
    const handler = (e: MouseEvent) => {
      if (fontOpen && !fontDropdownRef.current?.contains(e.target as Node)) setFontOpen(false);
      if (imageOpen && !imageDropdownRef.current?.contains(e.target as Node)) setImageOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fontOpen, imageOpen]);

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

  const fmtBtn = (
    label: string,
    icon: string,
    action: () => void,
    active: boolean,
    hoverColor = 'hover:bg-lavender'
  ) => (
    <button
      key={label}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      aria-label={label}
      className={`p-2 rounded-md transition-colors ${hoverColor} ${active ? 'bg-lavender text-ink' : 'text-ink/70 hover:text-ink'
        }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );

  return (
    /* The outer div is the hover trigger zone */
    <div className="fixed top-0 left-0 right-0 h-20 z-50 flex justify-center items-start group focus-hidden">
      {/* Gradient hint */}
      <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Toolbar — slides down on hover */}
      <div
        ref={toolbarInnerRef}
        className={`
          mt-3 bg-white border-2 border-ink shadow-hard rounded-rough
          px-4 py-2.5 flex items-center gap-4
          transform -translate-y-[120%] group-hover:translate-y-0
          transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${focusMode ? 'opacity-0 pointer-events-none' : ''}
        `}
      >
        {/* Branding / back to library */}
        <Link
          href="/"
          className="flex items-center gap-2 border-r-2 border-ink/20 pr-4 hover:opacity-70 transition-opacity"
          title="Back to Library"
        >
          <span className="material-symbols-outlined text-2xl">edit_note</span>
          <span className="font-heading font-bold text-base hidden sm:block truncate max-w-[160px]">
            {docTitle || 'Sable'}
          </span>
        </Link>

        {/* Formatting */}
        <div className="flex items-center gap-1">
          {fmtBtn('Bold', 'format_bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
          {fmtBtn('Italic', 'format_italic', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
          {fmtBtn('H1', 'format_h1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
          {fmtBtn('H2', 'format_h2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
          {fmtBtn('H3', 'format_h3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {fmtBtn('Quote', 'format_quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), 'hover:bg-peach')}
          {fmtBtn('Bullet list', 'format_list_bulleted', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
          {fmtBtn('Numbered list', 'format_list_numbered', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
          {fmtBtn('Highlight', 'highlight', () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'), 'hover:bg-peach')}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Image insert */}
        <div ref={imageDropdownRef} className="relative">
          <button
            onClick={() => setImageOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-rough-sm text-sm transition-all border-2 ${imageOpen ? 'bg-mint border-ink' : 'border-transparent hover:border-ink/30 hover:bg-gray-50'
              }`}
            title="Insert image"
          >
            <span className="material-symbols-outlined text-[20px]">image</span>
          </button>
          {imageOpen && (
            <div className="absolute top-full mt-2 left-0 z-[60] bg-white border-2 border-ink rounded-xl shadow-hard w-[280px] p-4 flex flex-col gap-3">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Insert Image</span>

              {/* URL input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && insertImageUrl()}
                  placeholder="Paste image URL…"
                  className="flex-1 border border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white"
                  autoFocus
                />
                <button
                  onClick={insertImageUrl}
                  disabled={!imageUrl.trim()}
                  className="px-3 py-2 bg-primary border border-ink/20 rounded-lg text-sm font-body font-semibold text-ink hover:bg-primary/80 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="font-marker">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* File upload */}
              <button
                onClick={() => imageFileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-ink/20 rounded-lg text-sm font-marker text-ink/60 hover:border-ink/40 hover:text-ink hover:bg-gray-50 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Upload from device
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

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Font picker */}
        <div ref={fontDropdownRef} className="relative">
          <button
            onClick={() => setFontOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-rough-sm text-sm transition-all border-2 ${fontOpen ? 'bg-lavender border-ink' : 'border-transparent hover:border-ink/30 hover:bg-gray-50'
              }`}
            title="Change font"
          >
            <span className="material-symbols-outlined text-[18px]">font_download</span>
            <span
              className="hidden sm:inline text-sm leading-none"
              style={{ fontFamily: currentFont.css || undefined }}
            >
              {currentFont.label}
            </span>
          </button>
          {fontOpen && (
            <div className="absolute top-full mt-2 left-0 z-[60] bg-white border-2 border-ink rounded-xl shadow-hard min-w-[180px] max-h-72 overflow-y-auto scrollbar-hide">
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
                  className={`w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3 ${font.css === activeFamily ? 'bg-primary/10' : ''
                    }`}
                  style={{ fontFamily: font.css || undefined }}
                >
                  <span className="text-sm text-ink">{font.label}</span>
                  {font.css === activeFamily && (
                    <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Preview toggle */}
        <button
          onClick={onPreviewToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-rough-sm font-marker text-base transition-all ${showPreview
            ? 'bg-lavender border-2 border-ink text-ink'
            : 'border-2 border-transparent hover:border-ink hover:bg-lavender/50'
            }`}
          title="Toggle live preview"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showPreview ? 'visibility_off' : 'visibility'}
          </span>
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Sketchpad */}
        <button
          onClick={onSketchpadToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-mint/50 hover:bg-mint border-2 border-transparent hover:border-ink rounded-rough-sm transition-all font-marker text-base"
          title="Open Sketchpad"
        >
          <span className="material-symbols-outlined text-[18px]">draw</span>
          <span className="hidden sm:inline">Sketchpad</span>
        </button>

        {/* Mood Board */}
        <button
          onClick={onMoodBoardToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-peach/50 hover:bg-peach border-2 border-transparent hover:border-ink rounded-rough-sm transition-all font-marker text-base"
          title="Open Mood Board"
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <span className="hidden sm:inline">Mood Board</span>
        </button>

        {/* History */}
        <button
          onClick={onHistoryOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender/40 hover:bg-lavender border-2 border-transparent hover:border-ink rounded-rough-sm transition-all font-marker text-base"
          title="Version History"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Publish */}
        <button
          onClick={onPublishOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white border-2 border-ink rounded-rough-sm hover:bg-primary hover:text-ink transition-all font-marker text-base"
          title="Export / Publish"
        >
          <span className="material-symbols-outlined text-[18px]">publish</span>
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </div>
  );
}
