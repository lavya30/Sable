'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { MarginNote } from '@/lib/types';

/* ── Note-color palette ──────────────────────────────────────────────────── */
const NOTE_COLORS: MarginNote['color'][] = ['peach', 'lavender', 'mint', 'rose'];

const COLOR_MAP: Record<MarginNote['color'], { bg: string; border: string }> = {
  peach:    { bg: 'bg-peach/40',    border: 'border-peach/60' },
  lavender: { bg: 'bg-lavender/40', border: 'border-lavender/60' },
  mint:     { bg: 'bg-mint/40',     border: 'border-mint/60' },
  rose:     { bg: 'bg-rose/40',     border: 'border-rose/60' },
};

function randomRotation(): number {
  return +(Math.random() * 4 - 2).toFixed(1); // -2 to +2 degrees
}

function pickColor(): MarginNote['color'] {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

/* ── Paragraph position helpers ──────────────────────────────────────────── */
interface ParaPos {
  index: number;
  top: number;   // relative to the editor wrapper
  height: number;
}

function getParagraphPositions(editor: Editor, wrapperEl: HTMLElement | null): ParaPos[] {
  if (!editor || !wrapperEl) return [];
  const positions: ParaPos[] = [];
  const wrapperRect = wrapperEl.getBoundingClientRect();
  let paraIndex = 0;

  editor.state.doc.forEach((node, offset) => {
    // We treat every top-level block as a "paragraph slot"
    try {
      const domNode = editor.view.nodeDOM(offset);
      if (domNode && domNode instanceof HTMLElement) {
        const rect = domNode.getBoundingClientRect();
        positions.push({
          index: paraIndex,
          top: rect.top - wrapperRect.top,
          height: rect.height,
        });
      }
    } catch {
      // nodeDOM can throw for some node types
    }
    paraIndex++;
  });

  return positions;
}

/* ── Single margin note card ─────────────────────────────────────────────── */
interface NoteCardProps {
  note: MarginNote;
  top: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

function NoteCard({ note, top, onUpdate, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(!note.content);
  const [draft, setDraft] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(draft.length, draft.length);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      onDelete(note.id);
    } else {
      onUpdate(note.id, trimmed);
    }
    setEditing(false);
  }

  const c = COLOR_MAP[note.color];

  return (
    <div
      className={`margin-note group absolute right-0 w-48 ${c.bg} ${c.border} border-2 rounded-lg p-2.5 shadow-hard-sm cursor-pointer transition-all duration-200 hover:shadow-hard hover:-translate-y-0.5 hover:z-30`}
      style={{
        top: `${top}px`,
        transform: `rotate(${note.rotation}deg)`,
      }}
      onClick={() => !editing && setEditing(true)}
      title="Click to edit"
    >
      {/* Connector line to paragraph */}
      <div className="absolute left-0 top-4 -translate-x-full w-6 h-px border-t-2 border-dashed border-ink/20" />

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
        aria-label="Delete note"
      >
        ×
      </button>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { setDraft(note.content); setEditing(false); }
          }}
          placeholder="Scribble a note…"
          className="w-full bg-transparent border-none resize-none outline-none font-marker text-sm text-ink leading-snug placeholder:text-ink/40 min-h-9"
          rows={2}
        />
      ) : (
        <p className="font-marker text-sm text-ink leading-snug whitespace-pre-wrap wrap-break-word select-none">
          {note.content}
        </p>
      )}

      <span className="block text-right text-[9px] font-marker text-ink/30 mt-1 select-none">
        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

/* ── Gutter main component ───────────────────────────────────────────────── */
interface Props {
  editor: Editor | null;
  marginNotes: MarginNote[];
  onChange: (notes: MarginNote[]) => void;
}

export function MarginNoteGutter({ editor, marginNotes, onChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [paraPositions, setParaPositions] = useState<ParaPos[]>([]);

  /* Recalculate paragraph positions whenever the editor state changes */
  const recalc = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    // Use the gutter wrapper as the reference frame
    setParaPositions(getParagraphPositions(editor, wrapperRef.current));
  }, [editor]);

  useEffect(() => {
    recalc();
    // Also listen to scroll / resize for re-positioning
    const editorScroll = wrapperRef.current?.closest('.overflow-y-auto');
    const handler = () => recalc();
    editorScroll?.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    return () => {
      editorScroll?.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [recalc]);

  // Re-calc when editor content changes
  useEffect(() => {
    if (!editor) return;
    const handler = () => requestAnimationFrame(recalc);
    editor.on('update', handler);
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [editor, recalc]);

  /* ── CRUD helpers ───────────────────────────────────────────────────── */
  function addNote(paragraphIndex: number) {
    const newNote: MarginNote = {
      id: `mn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      paragraphIndex,
      content: '',
      color: pickColor(),
      rotation: randomRotation(),
      createdAt: new Date().toISOString(),
    };
    onChange([...marginNotes, newNote]);
  }

  function updateNote(id: string, content: string) {
    onChange(marginNotes.map((n) => (n.id === id ? { ...n, content } : n)));
  }

  function deleteNote(id: string) {
    onChange(marginNotes.filter((n) => n.id !== id));
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  // Group notes by paragraph, stacking when multiple notes share a paragraph
  const notesByPara: Record<number, MarginNote[]> = {};
  for (const n of marginNotes) {
    (notesByPara[n.paragraphIndex] ??= []).push(n);
  }

  return (
    <div ref={wrapperRef} className="margin-note-gutter absolute top-0 left-0 w-full h-full pointer-events-none select-none pl-4" style={{ minHeight: '100%' }}>
      {/* Clickable "add" markers beside each paragraph */}
      {paraPositions.map((p) => (
        <button
          key={`add-${p.index}`}
          className="pointer-events-auto absolute -left-3 w-6 h-6 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/50 border border-primary/40 text-ink z-20"
          style={{ top: `${p.top + 2}px` }}
          title="Add margin note"
          onClick={() => addNote(p.index)}
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
        </button>
      ))}

      {/* Render notes positioned beside their paragraphs */}
      {paraPositions.map((p) => {
        const notes = notesByPara[p.index];
        if (!notes?.length) return null;
        return notes.map((note, stackIdx) => (
          <div key={note.id} className="pointer-events-auto" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <NoteCard
              note={note}
              top={p.top + stackIdx * 28} // stack offset
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          </div>
        ));
      })}
    </div>
  );
}
