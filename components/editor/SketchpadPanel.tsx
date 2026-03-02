'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface Heading {
  level: number;
  text: string;
  pos: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  onNotesChange: (v: string) => void;
  editor: Editor | null;
  docId: string;
}

function extractHeadings(editor: Editor | null): Heading[] {
  if (!editor) return [];
  const headings: Heading[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level as number, text: node.textContent, pos });
    }
  });
  return headings;
}

function computeStats(editor: Editor | null) {
  if (!editor) return { words: 0, chars: 0, paragraphs: 0, readTime: 1 };
  const words: number = editor.storage?.characterCount?.words?.() ?? 0;
  const chars: number = editor.storage?.characterCount?.characters?.() ?? 0;
  let paragraphs = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'paragraph' && node.textContent.trim()) paragraphs++;
  });
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, paragraphs, readTime };
}

export function SketchpadPanel({ isOpen, onClose, notes, onNotesChange, editor, docId }: Props) {
  const headings = useMemo(() => extractHeadings(editor), [editor?.state]);
  const stats = useMemo(() => computeStats(editor), [editor?.state]);

  // Find in document
  const [findQuery, setFindQuery] = useState('');
  const findRef = useRef<HTMLInputElement>(null);

  // Writing goal
  const goalKey = `sable-goal-${docId}`;
  const [goalInput, setGoalInput] = useState('');
  const [goal, setGoal] = useState<number>(0);
  useEffect(() => {
    const saved = localStorage.getItem(goalKey);
    if (saved) setGoal(parseInt(saved, 10));
  }, [goalKey]);
  function saveGoal() {
    const n = parseInt(goalInput, 10);
    if (n > 0) {
      setGoal(n);
      localStorage.setItem(goalKey, String(n));
    }
    setGoalInput('');
  }

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function scrollToHeading(pos: number) {
    if (!editor) return;
    onClose();
    requestAnimationFrame(() => {
      try {
        const domInfo = editor.view.domAtPos(pos + 1);
        let el = domInfo.node as HTMLElement;
        while (el && el.nodeType !== 1) el = el.parentElement as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
      }
    });
  }

  function findInDoc(backwards = false) {
    if (!findQuery.trim()) return;
    // window.find is available in all modern browsers
    (window as unknown as Record<string, (...a: unknown[]) => void>).find?.(
      findQuery, false, backwards, true, false, true, false
    );
  }

  const quickFormats = [
    { label: 'Bold',    icon: 'format_bold',          action: () => editor?.chain().focus().toggleBold().run(),             isActive: () => !!editor?.isActive('bold') },
    { label: 'Italic',  icon: 'format_italic',         action: () => editor?.chain().focus().toggleItalic().run(),           isActive: () => !!editor?.isActive('italic') },
    { label: 'H1',      icon: 'format_h1',             action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => !!editor?.isActive('heading', { level: 1 }) },
    { label: 'H2',      icon: 'format_h2',             action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => !!editor?.isActive('heading', { level: 2 }) },
    { label: 'Quote',   icon: 'format_quote',          action: () => editor?.chain().focus().toggleBlockquote().run(),       isActive: () => !!editor?.isActive('blockquote') },
    { label: 'Bullets', icon: 'format_list_bulleted',  action: () => editor?.chain().focus().toggleBulletList().run(),       isActive: () => !!editor?.isActive('bulletList') },
    { label: 'Numbers', icon: 'format_list_numbered',  action: () => editor?.chain().focus().toggleOrderedList().run(),      isActive: () => !!editor?.isActive('orderedList') },
    { label: 'Code',    icon: 'code',                  action: () => editor?.chain().focus().toggleCodeBlock().run(),        isActive: () => !!editor?.isActive('codeBlock') },
    { label: 'HR',      icon: 'horizontal_rule',       action: () => editor?.chain().focus().setHorizontalRule().run(),      isActive: () => false },
    { label: 'Undo',    icon: 'undo',                  action: () => editor?.chain().focus().undo().run(),                   isActive: () => false },
    { label: 'Redo',    icon: 'redo',                  action: () => editor?.chain().focus().redo().run(),                   isActive: () => false },
    { label: 'Clear',   icon: 'format_clear',          action: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), isActive: () => false },
  ];

  const goalPct = goal > 0 ? Math.min(100, Math.round((stats.words / goal) * 100)) : 0;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[380px] bg-white sketch-border border-l-0 shadow-[4px_0_0_#2D3436] flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-dot-grid-sketch opacity-[0.05] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink/10 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-ink">Sketchpad</h2>
            <span className="text-sm font-marker text-gray-500 -rotate-2 inline-block">Your writing toolkit</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-ink">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 flex flex-col gap-6 relative z-10">

          {/* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-lavender/30 border-2 border-ink/10 rounded-lg p-4 flex flex-col gap-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Document Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Words',      value: stats.words,      icon: 'article' },
                { label: 'Characters', value: stats.chars,      icon: 'text_fields' },
                { label: 'Paragraphs', value: stats.paragraphs, icon: 'segment' },
                { label: 'Read time',  value: `~${stats.readTime} min`, icon: 'schedule' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-ink/10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">{s.icon}</span>
                  <div>
                    <div className="font-display font-bold text-ink text-sm leading-tight">{s.value}</div>
                    <div className="text-[10px] font-marker text-gray-400">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Writing Goal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Writing Goal</h3>
            <div className="bg-mint/20 border-2 border-ink/10 rounded-lg p-4 flex flex-col gap-3">
              {goal > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-marker text-sm text-ink">{stats.words} / {goal} words</span>
                    <span className={`font-display font-bold text-sm ${goalPct >= 100 ? 'text-primary' : 'text-gray-500'}`}>
                      {goalPct >= 100 ? 'ðŸŽ‰ Done!' : `${goalPct}%`}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white border border-ink/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${goalPct >= 100 ? 'bg-primary' : 'bg-primary/60'}`}
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                  <button
                    onClick={() => { setGoal(0); localStorage.removeItem(goalKey); }}
                    className="text-xs font-marker text-gray-400 hover:text-red-500 self-end transition-colors"
                  >
                    Clear goal
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                    placeholder="Target wordsâ€¦"
                    min={1}
                    className="flex-1 border border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white"
                  />
                  <button
                    onClick={saveGoal}
                    className="px-3 py-2 bg-primary border border-ink/20 rounded-lg text-sm font-body font-semibold text-ink hover:bg-primary/80 transition-colors"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* â”€â”€ Quick Format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Quick Format</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {quickFormats.map((f) => (
                <button
                  key={f.label}
                  title={f.label}
                  onMouseDown={(e) => { e.preventDefault(); f.action(); }}
                  className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border-2 transition-all hover:-translate-y-0.5 ${
                    f.isActive()
                      ? 'bg-primary border-ink text-ink shadow-hard-sm'
                      : 'bg-white border-ink/20 text-gray-500 hover:border-ink hover:text-ink hover:shadow-hard-sm'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                  <span className="text-[9px] font-marker leading-none">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* â”€â”€ Find in Document â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Find in Document</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
                <input
                  ref={findRef}
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && findInDoc(e.shiftKey)}
                  placeholder="Search textâ€¦"
                  className="w-full pl-9 pr-3 py-2 border-2 border-ink/20 rounded-lg text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white transition-colors"
                />
              </div>
              <button
                onClick={() => findInDoc(true)}
                title="Previous match"
                className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-ink/20 hover:border-ink bg-white hover:bg-gray-50 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-600">expand_less</span>
              </button>
              <button
                onClick={() => findInDoc(false)}
                title="Next match"
                className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-ink/20 hover:border-ink bg-white hover:bg-gray-50 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-600">expand_more</span>
              </button>
            </div>
            <p className="text-[10px] font-marker text-gray-400">Press Enter / Shift+Enter to cycle matches</p>
          </div>

          {/* â”€â”€ Chapter Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Chapters</h3>
              {editor && (
                <button
                  onClick={() => {
                    const insertPos = editor.state.doc.content.size;
                    editor.chain().focus().insertContentAt(insertPos, [
                      { type: 'horizontalRule' },
                      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'New Chapter' }] },
                      { type: 'paragraph' },
                    ]).run();
                    setTimeout(() => {
                      try {
                        const newPos = editor.state.doc.content.size - 2;
                        const domInfo = editor.view.domAtPos(newPos);
                        let el = domInfo.node as HTMLElement;
                        while (el && el.nodeType !== 1) el = el.parentElement as HTMLElement;
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } catch { /* ignore */ }
                    }, 80);
                  }}
                  className="flex items-center gap-1 text-xs font-marker text-primary hover:text-ink transition-colors border border-primary/40 hover:border-ink rounded-full px-2.5 py-0.5 hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  New Page
                </button>
              )}
            </div>

            {headings.length === 0 ? (
              <p className="font-marker text-sm text-gray-400">Add H1/H2 headings to build your outline.</p>
            ) : (
              <nav className="flex flex-col gap-1.5">
                {headings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(h.pos)}
                    className={`group flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/5 cursor-pointer border-2 border-transparent hover:border-ink/20 transition-all text-left w-full ${
                      h.level === 1 ? 'pl-3' : h.level === 2 ? 'pl-6' : 'pl-9'
                    }`}
                  >
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary mt-0.5 transition-colors flex-shrink-0 text-[18px]">
                      {h.level === 1 ? 'edit_document' : 'description'}
                    </span>
                    <span className={`font-display text-gray-600 group-hover:text-ink transition-colors ${h.level === 1 ? 'font-bold' : 'font-medium text-sm'}`}>
                      {h.text || '(empty heading)'}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* â”€â”€ Scratch Notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">Scratch Area</h3>
            <div className="relative group">
              <div className="bg-peach rounded-lg p-4 sketch-border shadow-hard group-hover:-rotate-1 group-focus-within:-rotate-1 transition-transform relative overflow-hidden">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm rotate-2 z-10 shadow-sm" />
                <div className="flex items-center justify-between mb-2 border-b border-ink/10 pb-2">
                  <span className="text-xs font-marker text-ink/70">Quick Ideas</span>
                  <span className="text-[10px] font-marker text-ink/40">{notes.length} chars</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Jot down a quick thoughtâ€¦ Don't lose that spark!"
                  className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-ink font-marker text-base leading-relaxed placeholder:text-ink/40 min-h-[120px] outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-ink/10 bg-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary sketch-border flex items-center justify-center shadow-hard-sm flex-shrink-0">
              <span className="material-symbols-outlined text-ink text-sm">person</span>
            </div>
            <div>
              <span className="text-sm font-display font-bold text-ink">Author Mode</span>
              <span className="block text-xs text-gray-500 font-marker">Keep writing!</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
