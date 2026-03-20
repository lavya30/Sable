'use client';

import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
}

function getPlainText(editor: Editor): string {
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', '\n');
}

function fleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getReadabilityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Very Easy', color: 'text-primary' };
  if (score >= 60) return { label: 'Standard', color: 'text-mint' };
  if (score >= 40) return { label: 'Difficult', color: 'text-peach' };
  return { label: 'Complex', color: 'text-rose' };
}

export function ReadabilityBadge({ editor }: Props) {
  const [readingTime, setReadingTime] = useState(0);
  const [readability, setReadability] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const text = getPlainText(editor);
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      setReadingTime(Math.max(1, Math.ceil(wordCount / 200)));
      setReadability(fleschKincaid(text));
    };

    update();
    editor.on('update', update);
    return () => { editor.off('update', update); };
  }, [editor]);

  if (!editor) return null;

  const { label, color } = getReadabilityLabel(readability);

  return (
    <div className="btn-magnetic group relative flex items-center gap-2 px-3 py-2 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all">
      <span className="material-symbols-outlined text-[16px] text-ink/40">schedule</span>
      <span className="font-mono text-xs font-bold text-ink/60">{readingTime} min</span>
      <div className="w-px h-3 bg-ink/15" />
      <span className={`font-mono text-xs font-bold ${color}`}>{label}</span>
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Readability: {readability}/100
      </span>
    </div>
  );
}
