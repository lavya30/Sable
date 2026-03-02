'use client';

import Link from 'next/link';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
  onSketchpadToggle: () => void;
  onPublishOpen: () => void;
  focusMode: boolean;
  showPreview: boolean;
  onPreviewToggle: () => void;
  docTitle: string;
}

export function EditorToolbar({
  editor,
  onSketchpadToggle,
  onPublishOpen,
  focusMode,
  showPreview,
  onPreviewToggle,
  docTitle,
}: Props) {
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
      className={`p-2 rounded-md transition-colors ${hoverColor} ${
        active ? 'bg-lavender text-ink' : 'text-ink/70 hover:text-ink'
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
          {fmtBtn('Bold',       'format_bold',   () => editor.chain().focus().toggleBold().run(),                       editor.isActive('bold'))}
          {fmtBtn('Italic',     'format_italic', () => editor.chain().focus().toggleItalic().run(),                     editor.isActive('italic'))}
          {fmtBtn('H1',         'format_h1',     () => editor.chain().focus().toggleHeading({ level: 1 }).run(),        editor.isActive('heading', { level: 1 }))}
          {fmtBtn('H2',         'format_h2',     () => editor.chain().focus().toggleHeading({ level: 2 }).run(),        editor.isActive('heading', { level: 2 }))}
          {fmtBtn('H3',         'format_h3',     () => editor.chain().focus().toggleHeading({ level: 3 }).run(),        editor.isActive('heading', { level: 3 }))}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {fmtBtn('Quote',      'format_quote',  () => editor.chain().focus().toggleBlockquote().run(),                 editor.isActive('blockquote'), 'hover:bg-peach')}
          {fmtBtn('Bullet list','format_list_bulleted', () => editor.chain().focus().toggleBulletList().run(),          editor.isActive('bulletList'))}
          {fmtBtn('Numbered list','format_list_numbered', () => editor.chain().focus().toggleOrderedList().run(),       editor.isActive('orderedList'))}
          {fmtBtn('Highlight',  'highlight',     () => editor.chain().focus().toggleHighlight().run(),                  editor.isActive('highlight'), 'hover:bg-peach')}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Preview toggle */}
        <button
          onClick={onPreviewToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-rough-sm font-marker text-base transition-all ${
            showPreview
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
