'use client';

import { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export function OutlinePanel({ isOpen, onClose, editor }: Props) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  const extractHeadings = useCallback(() => {
    if (!editor) return;
    const items: HeadingItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        items.push({
          id: `heading-${pos}`,
          level: node.attrs.level as number,
          text: node.textContent,
          pos,
        });
      }
    });
    setHeadings(items);
  }, [editor]);

  useEffect(() => {
    if (!editor || !isOpen) return;
    extractHeadings();
    editor.on('update', extractHeadings);
    return () => { editor.off('update', extractHeadings); };
  }, [editor, isOpen, extractHeadings]);

  function scrollToHeading(pos: number) {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos + 1).run();
    // Scroll the heading into view
    const domAtPos = editor.view.domAtPos(pos + 1);
    if (domAtPos?.node) {
      const el = domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 bottom-0 w-72 z-[60] bg-white border-r-2 border-ink shadow-hard-lg flex flex-col animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ink/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">toc</span>
          <h3 className="font-heading font-bold text-sm">Outline</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-ink/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-ink/40">close</span>
        </button>
      </div>

      {/* Heading list */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {headings.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-ink/15 mb-2 block">format_h1</span>
            <p className="text-sm text-ink/30 font-body">
              No headings yet. Add H1, H2, or H3 headings to see your outline.
            </p>
          </div>
        ) : (
          <nav className="space-y-0.5">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollToHeading(h.pos)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors group ${
                  h.level === 1 ? '' : h.level === 2 ? 'pl-6' : 'pl-9'
                }`}
              >
                <span className={`font-display block truncate transition-colors group-hover:text-ink ${
                  h.level === 1
                    ? 'font-bold text-sm text-ink'
                    : h.level === 2
                    ? 'font-semibold text-[13px] text-ink/70'
                    : 'text-xs text-ink/50'
                }`}>
                  {h.text || '(empty heading)'}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-ink/10">
        <p className="text-[10px] text-ink/25 font-marker text-center">
          {headings.length} heading{headings.length !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
}
