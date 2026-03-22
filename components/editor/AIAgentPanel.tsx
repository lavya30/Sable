'use client';

import { useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { callAI } from '@/lib/ai';
import { useSettings } from '@/context/SettingsContext';

type AgentAction = 'fix_grammar' | 'rewrite' | 'summarize' | 'continue';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  initialAction?: AgentAction;
  initialContext?: string;
}

const ACTIONS: Array<{ key: AgentAction; label: string; icon: string }> = [
  { key: 'fix_grammar', label: 'Fix Grammar', icon: 'spellcheck' },
  { key: 'rewrite', label: 'Rewrite', icon: 'edit' },
  { key: 'summarize', label: 'Summarize', icon: 'short_text' },
  { key: 'continue', label: 'Continue', icon: 'arrow_forward' },
];

export function AIAgentPanel({ isOpen, onClose, editor, initialAction = 'fix_grammar', initialContext = '' }: Props) {
  const { settings } = useSettings();
  const [action, setAction] = useState<AgentAction>(initialAction);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [targetRange, setTargetRange] = useState<{ from: number; to: number } | null>(null);

  const hasSelection = useMemo(() => {
    if (!editor) return false;
    const { from, to } = editor.state.selection;
    return from !== to;
  }, [editor?.state.selection, editor]);

  function getRequestText() {
    if (!editor) {
      return { text: '', range: null as { from: number; to: number } | null, context: '' };
    }

    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, '\n').trim();

    if (selected) {
      const full = editor.getText();
      return {
        text: selected,
        range: { from, to },
        context: full.slice(0, 20000),
      };
    }

    const fullText = editor.getText().trim();
    if (action === 'summarize' && fullText) {
      return {
        text: fullText,
        range: { from, to },
        context: fullText.slice(0, 20000),
      };
    }

    if (initialContext) {
      return {
        text: initialContext,
        range: { from: editor.state.selection.from, to: editor.state.selection.from },
        context: fullText.slice(0, 20000),
      };
    }

    const aroundCursor = editor.state.doc.textBetween(Math.max(1, from - 220), Math.min(editor.state.doc.content.size, from + 220), '\n').trim();

    return {
      text: aroundCursor || fullText,
      range: { from, to },
      context: fullText.slice(0, 20000),
    };
  }

  async function handleGenerate() {
    if (!editor) return;

    const providerConfig = {
      openai:  { key: settings.openaiApiKey,  model: settings.openaiModel,  label: 'OpenAI' },
      gemini:  { key: settings.geminiApiKey,  model: settings.geminiModel,  label: 'Google Gemini' },
      claude:  { key: settings.claudeApiKey,  model: settings.claudeModel,  label: 'Anthropic Claude' },
    };
    const cfg = providerConfig[settings.aiProvider];

    if (!cfg.key) {
      setError(`No API key configured for ${cfg.label}. Go to Settings → AI Assistant to add your key.`);
      return;
    }

    const payload = getRequestText();
    if (!payload.text.trim()) {
      setError('Select text or write some content first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestion('');
    setSourceText(payload.text);
    setTargetRange(payload.range);

    const result = await callAI({
      action,
      text: payload.text,
      context: payload.context,
      instruction,
      apiKey: cfg.key,
      model: cfg.model,
      provider: settings.aiProvider,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuggestion(result.suggestion ?? '');
    }

    setLoading(false);
  }

  function handleApply() {
    if (!editor || !suggestion.trim() || !targetRange) return;

    const maxPos = editor.state.doc.content.size;
    const from = Math.max(0, Math.min(targetRange.from, maxPos));
    const to = Math.max(from, Math.min(targetRange.to, maxPos));

    // Validate range is valid for insertion
    if (from > to || from < 0 || to > maxPos) {
      console.error('Invalid text range for suggestion insertion', { from, to, maxPos });
      return;
    }

    editor.chain().focus().setTextSelection({ from, to }).insertContent(suggestion).run();
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/20 cursor-pointer" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-[95vw] bg-white dark:bg-slate-800 border-l-2 border-ink/10 dark:border-slate-700 shadow-[-4px_0_0_#2D3436] dark:shadow-[-4px_0_0_#334155] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-ink/10 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-ink dark:text-slate-100">AI Assistant</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Suggest, then apply changes safely</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-ink/20 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              aria-label="Close AI panel"
            >
              <span className="material-symbols-outlined text-[18px] text-ink dark:text-slate-100">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar" data-lenis-prevent>
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Action</p>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setAction(item.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      action === item.key
                        ? 'border-primary bg-primary/10 text-ink dark:text-slate-100'
                        : 'border-ink/10 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Instruction (optional)</p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={3}
                placeholder="Example: Keep it concise and warm tone"
                className="w-full rounded-lg border border-ink/15 dark:border-slate-600 bg-white dark:bg-slate-700 text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hasSelection ? 'Using selected text' : 'Using nearby text/document context'}
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading || !editor}
                className="px-4 py-2 rounded-lg border-2 border-ink dark:border-slate-500 bg-ink dark:bg-slate-700 text-white text-sm font-display font-bold hover:bg-primary hover:text-ink dark:hover:bg-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Thinking...' : 'Generate'}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            {sourceText && (
              <div>
                <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Source</p>
                <div className="rounded-lg border border-ink/10 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/70 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap max-h-28 overflow-auto custom-scrollbar">
                  {sourceText}
                </div>
              </div>
            )}

            {suggestion && (
              <div>
                <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Suggestion</p>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-ink/10 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-ink dark:text-slate-100 outline-none focus:border-primary"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 rounded-lg border-2 border-ink dark:border-slate-500 bg-primary text-ink text-sm font-display font-bold hover:bg-primary/80 transition-colors"
                  >
                    Apply to Editor
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg border border-ink/20 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
