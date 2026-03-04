'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tiptap/react';
import { checkGrammar, buildTextAndMap, LTMatch } from '@/lib/grammar';
import { lookupWord, DictResult } from '@/lib/dictionary';

// Tiptap-managed decoration — wraps the current word with .is-focus-word.
// Uses Decoration.inline() so a <span> is inserted that CSS can target.
const FocusWordDecoration = Extension.create({
  name: 'focusWordDecoration',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('focusWordDecoration'),
        props: {
          decorations(state) {
            const { $from, empty } = state.selection;
            // Only apply in collapsed (cursor) selection
            if (!empty || $from.depth < 1) return DecorationSet.empty;

            const parentStart  = $from.start();   // start of the text block
            const parentText   = $from.parent.textContent;
            const offsetInParent = $from.pos - parentStart;

            if (!parentText.trim()) return DecorationSet.empty;

            // Walk left/right to find word boundaries (stop at whitespace / punctuation)
            let ws = offsetInParent;
            let we = offsetInParent;
            while (ws > 0 && !/[\s]/.test(parentText[ws - 1])) ws--;
            while (we < parentText.length && !/[\s]/.test(parentText[we])) we++;

            if (ws === we) return DecorationSet.empty; // cursor is on whitespace

            const from = parentStart + ws;
            const to   = parentStart + we;

            try {
              return DecorationSet.create(state.doc, [
                Decoration.inline(from, to, { class: 'is-focus-word' }),
              ]);
            } catch {
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});

const GRAMMAR_META_KEY = 'grammarMatches';

interface GrammarPluginState {
  matches: LTMatch[];
  map: number[];
}

const GrammarPluginKey = new PluginKey<GrammarPluginState>('grammar');

function createGrammarPlugin(): Plugin {
  return new Plugin({
    key: GrammarPluginKey,
    state: {
      init(): GrammarPluginState {
        return { matches: [], map: [] };
      },
      apply(tr, old): GrammarPluginState {
        const meta = tr.getMeta(GRAMMAR_META_KEY);
        if (meta) return meta as GrammarPluginState;
        return old;
      },
    },
    props: {
      decorations(state) {
        const ps = GrammarPluginKey.getState(state);
        if (!ps || !ps.matches.length) return DecorationSet.empty;
        const { matches, map } = ps;
        const list: Decoration[] = [];
        matches.forEach((match, idx) => {
          const from = map[match.offset];
          if (from === undefined || from < 0) return;
          const toCharIdx = match.offset + match.length - 1;
          if (toCharIdx >= map.length) return;
          const to = map[toCharIdx] + 1;
          if (to <= from) return;
          try {
            list.push(
              Decoration.inline(from, to, {
                class: match.issueType === 'misspelling' ? 'lt-spelling' : 'lt-grammar',
                'data-lt-idx': String(idx),
              })
            );
          } catch { }
        });
        return DecorationSet.create(state.doc, list);
      },
    },
  });
}

const GrammarExtension = Extension.create({
  name: 'grammar',
  addProseMirrorPlugins() {
    return [createGrammarPlugin()];
  },
});

export interface TiptapEditorRef {
  getHTML: () => string;
  getJSON: () => object;
  getWordCount: () => number;
  editor: Editor | null;
}

interface Props {
  content: string; // Tiptap JSON string
  onChange: (json: string, html: string) => void;
  onEditorReady?: (editor: Editor) => void;
  fontSize: number;
  lineSpacing: number;
  focusMode: boolean;
  readOnly?: boolean;
}

const TiptapEditor = forwardRef<TiptapEditorRef, Props>(function TiptapEditor(
  { content, onChange, onEditorReady, fontSize, lineSpacing, focusMode, readOnly = false },
  ref
) {
  const grammarMatchesRef = useRef<LTMatch[]>([]);
  const grammarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [grammarTooltip, setGrammarTooltip] = useState<{ match: LTMatch; x: number; y: number } | null>(null);
  const [grammarChecking, setGrammarChecking] = useState(false);
  const [dictPopover, setDictPopover] = useState<{ word: string; result: DictResult | null; loading: boolean } | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start something wonderful…',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      FocusWordDecoration,
      GrammarExtension,
      TextStyle,
      FontFamily,
    ],
    editorProps: {
      attributes: {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
    },
    content: (() => {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    })(),
    editable: !readOnly,
    onCreate({ editor }) {
      onEditorReady?.(editor);
    },
    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()), editor.getHTML());
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? '',
    getJSON: () => editor?.getJSON() ?? {},
    getWordCount: () => editor?.storage?.characterCount?.words() ?? 0,
    editor: editor ?? null,
  }));

  // When the document changes externally (e.g. new doc loaded), reset content
  useEffect(() => {
    if (!editor) return;
    const newJson = (() => {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    })();
    // Only update if the content actually differs to avoid cursor jumps
    const current = JSON.stringify(editor.getJSON());
    if (current !== content) {
      editor.commands.setContent(newJson, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    if (!editor) return;
    const run = async () => {
      const { text, map } = buildTextAndMap(editor.state.doc);
      if (!text.trim()) return;
      setGrammarChecking(true);
      const matches = await checkGrammar(text);
      setGrammarChecking(false);
      grammarMatchesRef.current = matches;
      editor.view.dispatch(
        editor.state.tr.setMeta(GRAMMAR_META_KEY, { matches, map })
      );
    };
    const schedule = () => {
      if (grammarTimerRef.current) clearTimeout(grammarTimerRef.current);
      grammarTimerRef.current = setTimeout(run, 1500);
    };
    editor.on('update', schedule);
    schedule();
    return () => {
      editor.off('update', schedule);
      if (grammarTimerRef.current) clearTimeout(grammarTimerRef.current);
    };
  }, [editor]);

  const cancelTooltipHide = () => {
    if (tooltipHideTimerRef.current) {
      clearTimeout(tooltipHideTimerRef.current);
      tooltipHideTimerRef.current = null;
    }
  };

  const scheduleTooltipHide = () => {
    cancelTooltipHide();
    tooltipHideTimerRef.current = setTimeout(() => setGrammarTooltip(null), 180);
  };

  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const ltEl = target.closest('[data-lt-idx]') as HTMLElement | null;
      if (!ltEl) return;
      cancelTooltipHide();
      const idx = parseInt(ltEl.getAttribute('data-lt-idx') ?? '');
      const match = grammarMatchesRef.current[idx];
      if (!match) return;
      const rect = ltEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const TOOLTIP_W = 320;
      const rawX = rect.left;
      const clampedX = Math.max(8, Math.min(rawX, vw - TOOLTIP_W - 8));
      setGrammarTooltip({ match, x: clampedX, y: rect.bottom + 6 });
    };
    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest('[data-lt-idx]')) return;
      if (related?.closest('[data-grammar-tooltip]')) return;
      scheduleTooltipHide();
    };
    el.addEventListener('mouseover', onOver);
    el.addEventListener('mouseout', onOut);
    return () => {
      el.removeEventListener('mouseover', onOver);
      el.removeEventListener('mouseout', onOut);
    };
  }, []);

  function applyGrammarSuggestion(replacement: string) {
    if (!editor || !grammarTooltip) return;
    const ps = GrammarPluginKey.getState(editor.state);
    if (!ps) return;
    const { map } = ps;
    const { match } = grammarTooltip;
    const from = map[match.offset];
    if (from === undefined || from < 0) return;
    const toCharIdx = match.offset + match.length - 1;
    if (toCharIdx >= map.length) return;
    const to = map[toCharIdx] + 1;
    if (to <= from) return;
    editor.view.dispatch(
      editor.state.tr.replaceWith(from, to, editor.state.schema.text(replacement))
    );
    setGrammarTooltip(null);
  }

  async function handleDefine() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const raw = editor.state.doc.textBetween(from, to, ' ').trim();
    if (!raw) return;
    const word = raw.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '');
    if (!word) return;
    setDictPopover({ word, result: null, loading: true });
    const result = await lookupWord(word);
    setDictPopover({ word, result, loading: false });
  }

  const bubbleMenuItems = [
    {
      label: 'Bold',
      icon: 'format_bold',
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold') ?? false,
    },
    {
      label: 'Italic',
      icon: 'format_italic',
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic') ?? false,
    },
    {
      label: 'H1',
      icon: 'format_h1',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor?.isActive('heading', { level: 1 }) ?? false,
    },
    {
      label: 'H2',
      icon: 'format_h2',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive('heading', { level: 2 }) ?? false,
    },
    {
      label: 'H3',
      icon: 'format_h3',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor?.isActive('heading', { level: 3 }) ?? false,
    },
  ];

  return (
    <div
      ref={editorContainerRef}
      className={`relative transition-all duration-300 ${
        focusMode ? 'focus-mode-active' : ''
      }`}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
        >
          <div className="flex items-center bg-ink text-white rounded-rough shadow-xl px-3 py-1.5 gap-1">
            {bubbleMenuItems.map((item) => (
              <button
                key={item.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  item.action();
                }}
                className={`p-1.5 rounded transition-colors hover:text-mint ${
                  item.isActive() ? 'text-mint' : 'text-white'
                }`}
                aria-label={item.label}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </button>
            ))}

            <div className="w-px h-4 bg-gray-600 mx-1" />

            {/* Annotation / comment highlight */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHighlight().run();
              }}
              className={`p-1.5 rounded transition-colors hover:text-peach ${
                editor.isActive('highlight') ? 'text-peach' : 'text-white'
              }`}
              aria-label="Annotate — highlight text"
            >
              <span className="material-symbols-outlined text-[18px]">
                comment
              </span>
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-1.5 rounded transition-colors hover:text-mint ${
                editor.isActive('link') ? 'text-mint' : 'text-white'
              }`}
              aria-label="Add link"
            >
              <span className="material-symbols-outlined text-[18px]">
                link
              </span>
            </button>

            {(() => {
              const { from, to } = editor.state.selection;
              if (from === to) return null;
              return (
                <>
                  <div className="w-px h-4 bg-gray-600 mx-0.5" />
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDefine();
                    }}
                    className="p-1.5 rounded transition-colors hover:text-mint text-white"
                    aria-label="Define word"
                    title="Define"
                  >
                    <span className="material-symbols-outlined text-[18px]">book_2</span>
                  </button>
                </>
              );
            })()}

            {/* Arrow indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
          </div>
        </BubbleMenu>
      )}

      <EditorContent
        editor={editor}
        className="tiptap-editor w-full outline-none"
        spellCheck={false}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineSpacing,
        }}
      />

      {grammarChecking && (
        <div className="absolute top-0 right-0 flex items-center gap-1.5 px-2 py-1 rounded-bl-lg bg-white/80 dark:bg-surface/80 border-b border-l border-ink/10 text-[10px] font-marker text-gray-400 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
          Checking...
        </div>
      )}

      {grammarTooltip && (
        <div
          data-grammar-tooltip
          className="fixed z-[200] bg-ink text-white rounded-rough shadow-xl p-3 max-w-xs text-sm pointer-events-auto"
          style={{ left: grammarTooltip.x, top: grammarTooltip.y }}
          onMouseEnter={cancelTooltipHide}
          onMouseLeave={scheduleTooltipHide}
        >
          <p className="text-white/80 mb-2 text-xs leading-snug">{grammarTooltip.match.message}</p>
          {grammarTooltip.match.replacements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              <p className="w-full text-[10px] text-white/50 mb-0.5">Suggestions:</p>
              {grammarTooltip.match.replacements.map((r) => (
                <button
                  key={r}
                  onClick={() => applyGrammarSuggestion(r)}
                  className="bg-mint text-ink text-xs px-2 py-0.5 rounded font-medium hover:bg-mint/80 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          {grammarTooltip.match.replacements.length === 0 && (
            <p className="text-white/40 text-[10px] mt-1">No suggestions available</p>
          )}
        </div>
      )}

      {dictPopover && (
        <div className="fixed z-[200] inset-x-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] bg-white border-2 border-ink rounded-rough shadow-hard p-5 max-h-72 overflow-y-auto scrollbar-hide">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-marker text-xl text-ink">{dictPopover.word}</h3>
            <button
              onClick={() => setDictPopover(null)}
              className="text-ink/40 hover:text-ink transition-colors ml-4 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          {dictPopover.loading && (
            <p className="text-ink/50 text-sm">Looking up&hellip;</p>
          )}
          {!dictPopover.loading && !dictPopover.result && (
            <p className="text-ink/50 text-sm">No definition found.</p>
          )}
          {!dictPopover.loading && dictPopover.result?.meanings.map((m, i) => (
            <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-ink/10' : ''}>
              <span className="text-xs font-bold text-primary/80 uppercase tracking-wide">{m.partOfSpeech}</span>
              {m.definitions.map((d, j) => (
                <div key={j} className="mt-1.5">
                  <p className="text-ink text-sm">{d.definition}</p>
                  {d.example && (
                    <p className="text-ink/50 text-xs mt-0.5 italic">&ldquo;{d.example}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default TiptapEditor;
