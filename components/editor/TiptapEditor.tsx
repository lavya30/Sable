'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { ResizableImage } from './ResizableImage';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { checkGrammar, buildTextAndMap, LTMatch } from '@/lib/grammar';
import { lookupWord, DictResult } from '@/lib/dictionary';
import { SlashCommandExtension } from '@/lib/slash-command';
import { createSlashSuggestion } from './SlashCommand';
import SearchAndReplace from '@sereneinserenade/tiptap-search-and-replace';

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

            const parentStart = $from.start();   // start of the text block
            const parentText = $from.parent.textContent;
            const offsetInParent = $from.pos - parentStart;

            if (!parentText.trim()) return DecorationSet.empty;

            // Walk left/right to find word boundaries (stop at whitespace / punctuation)
            let ws = offsetInParent;
            let we = offsetInParent;
            while (ws > 0 && !/[\s]/.test(parentText[ws - 1])) ws--;
            while (we < parentText.length && !/[\s]/.test(parentText[we])) we++;

            if (ws === we) return DecorationSet.empty; // cursor is on whitespace

            const from = parentStart + ws;
            const to = parentStart + we;

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
        if (tr.docChanged && old.map.length > 0) {
          const newMap = old.map.map((pos) => (pos < 0 ? -1 : tr.mapping.map(pos)));
          return { matches: old.matches, map: newMap };
        }
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
  onSlashCommand?: (command: string, context: string) => void;
}

const TiptapEditor = forwardRef<TiptapEditorRef, Props>(function TiptapEditor(
  { content, onChange, onEditorReady, fontSize, lineSpacing, focusMode, readOnly = false, onSlashCommand },
  ref
) {
  const grammarMatchesRef = useRef<LTMatch[]>([]);
  const grammarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [grammarTooltip, setGrammarTooltip] = useState<{ match: LTMatch; x: number; y: number } | null>(null);
  const [grammarChecking, setGrammarChecking] = useState(false);
  const [dictPopover, setDictPopover] = useState<{ word: string; result: DictResult | null; loading: boolean } | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Link popover state
  const [linkMode, setLinkMode] = useState<'idle' | 'input' | 'active'>('idle');
  const [linkInput, setLinkInput] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  function normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

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
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      ResizableImage,
      FocusWordDecoration,
      GrammarExtension,
      SlashCommandExtension.configure({
        suggestion: createSlashSuggestion((command, context) => {
          onSlashCommand?.(command, context);
        }),
      }),
      TextStyle,
      FontFamily,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      SearchAndReplace.configure({
        searchResultClass: 'search-result',
        disableRegex: false,
      }),
    ],
    editorProps: {
      attributes: {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          console.error('Image file too large. Maximum size is 5MB.');
          return false;
        }
        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY }) ?? { pos: view.state.selection.from };
          const node = view.state.schema.nodes.image.create({ src });
          const tr = view.state.tr.insert(pos, node);
          view.dispatch(tr);
        };
        reader.onerror = () => {
          console.error('Error reading dropped image file.');
        };
        reader.readAsDataURL(file);
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
              console.error('Image file too large. Maximum size is 5MB.');
              return false;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const src = reader.result as string;
              const node = view.state.schema.nodes.image.create({ src });
              const tr = view.state.tr.replaceSelectionWith(node);
              view.dispatch(tr);
            };
            reader.onerror = () => {
              console.error('Error reading pasted image file.');
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    content: (() => {
      try {
        const parsed = JSON.parse(content);
        // Validate that parsed content is an object (valid Tiptap JSON)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
        console.warn('Invalid Tiptap JSON structure, using empty doc');
        return { type: 'doc', content: [] };
      } catch (error) {
        console.error('Error parsing editor content:', error instanceof Error ? error.message : String(error));
        return { type: 'doc', content: [] };
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

  const handleSetLink = useCallback(() => {
    const href = normalizeUrl(linkInput);
    if (href && editor) {
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkMode('idle');
    setLinkInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, linkInput]);

  const handleRemoveLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
    setLinkMode('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Reset link mode when selection collapses
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (editor.state.selection.empty) {
        setLinkMode('idle');
        setLinkInput('');
      }
    };
    editor.on('selectionUpdate', handler);
    return () => { editor.off('selectionUpdate', handler); };
  }, [editor]);

  // When the document changes externally (e.g. new doc loaded), reset content
  useEffect(() => {
    if (!editor) return;
    const newJson = (() => {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null && parsed.type === 'doc') {
          return parsed;
        }
        console.warn('Invalid Tiptap JSON structure in external update, preserving current content');
        return editor.getJSON();
      } catch (error) {
        console.error('Error parsing external content update:', error instanceof Error ? error.message : String(error));
        return editor.getJSON();
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
      className={`relative transition-all duration-300 ${focusMode ? 'focus-mode-active' : ''
        }`}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) => {
            // Always show when text is selected; hide when link mode is idle and no selection
            const { empty } = ed.state.selection;
            return !empty;
          }}
        >
          <div className="relative">
            {/* ── Link input mode ────────────────────────────────────────── */}
            {linkMode === 'input' && (
              <div className="flex items-center bg-white border-2 border-ink rounded-rough shadow-hard px-3 py-2 gap-2 min-w-[280px]">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">link</span>
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleSetLink(); }
                    if (e.key === 'Escape') { setLinkMode('idle'); setLinkInput(''); }
                  }}
                  placeholder="Paste or type a URL…"
                  className="flex-1 text-sm font-body text-ink bg-transparent outline-none placeholder:text-ink/30"
                  autoFocus
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleSetLink(); }}
                  disabled={!linkInput.trim()}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary text-ink text-xs font-display font-bold rounded-md hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Apply
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setLinkMode('idle'); setLinkInput(''); }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors text-ink/40 hover:text-ink flex-shrink-0"
                  aria-label="Cancel"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
                <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
              </div>
            )}

            {/* ── Link active mode (on a link) ───────────────────────────── */}
            {linkMode === 'active' && (() => {
              const href = editor.getAttributes('link').href ?? '';
              return (
                <div className="flex items-center bg-white border-2 border-ink rounded-rough shadow-hard px-3 py-2 gap-2 max-w-[320px]">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">link</span>
                  <span className="flex-1 text-xs font-mono text-ink/70 truncate" title={href}>{href}</span>
                  <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                  <a
                    href={normalizeUrl(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-1 rounded hover:bg-primary/10 transition-colors text-ink/50 hover:text-primary flex-shrink-0"
                    title="Open link"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLinkInput(href);
                      setLinkMode('input');
                      setTimeout(() => linkInputRef.current?.focus(), 50);
                    }}
                    className="p-1 rounded hover:bg-lavender/40 transition-colors text-ink/50 hover:text-ink flex-shrink-0"
                    title="Edit link"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleRemoveLink(); }}
                    className="p-1 rounded hover:bg-red-50 transition-colors text-ink/50 hover:text-red-500 flex-shrink-0"
                    title="Remove link"
                  >
                    <span className="material-symbols-outlined text-[16px]">link_off</span>
                  </button>
                  <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
                </div>
              );
            })()}

            {/* ── Normal formatting menu ─────────────────────────────────── */}
            {linkMode === 'idle' && (
              <div className="flex items-center bg-ink text-white rounded-rough shadow-xl px-3 py-1.5 gap-1">
                {bubbleMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      item.action();
                    }}
                    className={`p-1.5 rounded transition-colors hover:text-mint ${item.isActive() ? 'text-mint' : 'text-white'
                      }`}
                    aria-label={item.label}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </button>
                ))}

                <div className="w-px h-4 bg-gray-600 mx-1" />

                {/* Highlight */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleHighlight().run();
                  }}
                  className={`p-1.5 rounded transition-colors hover:text-peach ${editor.isActive('highlight') ? 'text-peach' : 'text-white'
                    }`}
                  aria-label="Highlight"
                >
                  <span className="material-symbols-outlined text-[18px]">comment</span>
                </button>

                {/* Link button */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (editor.isActive('link')) {
                      setLinkMode('active');
                    } else {
                      setLinkInput('');
                      setLinkMode('input');
                      setTimeout(() => linkInputRef.current?.focus(), 50);
                    }
                  }}
                  className={`p-1.5 rounded transition-colors hover:text-mint ${editor.isActive('link') ? 'text-mint' : 'text-white'
                    }`}
                  aria-label="Add link"
                >
                  <span className="material-symbols-outlined text-[18px]">link</span>
                </button>

                {/* Define */}
                {editor.state.selection.from !== editor.state.selection.to && (
                  <>
                    <div className="w-px h-4 bg-gray-600 mx-0.5" />
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleDefine();
                      }}
                      className="p-1.5 rounded transition-colors hover:text-mint text-white"
                      aria-label="Define word"
                    >
                      <span className="material-symbols-outlined text-[18px]">book_2</span>
                    </button>
                  </>
                )}

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
              </div>
            )}
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) =>
            ed.isActive('tableCell') || ed.isActive('tableHeader')
          }
        >
          <div className="flex items-center bg-ink text-white rounded-rough shadow-xl px-2 py-1.5 gap-0.5">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider px-1 text-white/50 border-r border-white/20 mr-0.5 pr-2">Table</span>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }} title="Add row above" className="p-1.5 rounded hover:text-mint transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }} title="Add row below" className="p-1.5 rounded hover:text-mint transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }} title="Add column left" className="p-1.5 rounded hover:text-mint transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }} title="Add column right" className="p-1.5 rounded hover:text-mint transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <div className="w-px h-4 bg-gray-600 mx-0.5" />
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }} title="Delete row" className="p-1.5 rounded hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }} title="Delete column" className="p-1.5 rounded hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-[16px]">view_column</span>
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().mergeOrSplit().run(); }} title="Merge / split cells" className="p-1.5 rounded hover:text-mint transition-colors">
              <span className="material-symbols-outlined text-[16px]">merge</span>
            </button>
            <div className="w-px h-4 bg-gray-600 mx-0.5" />
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} title="Delete table" className="p-1.5 rounded hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
            </button>
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
