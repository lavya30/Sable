'use client';

import { useState, useEffect } from 'react';

interface Props {
  wordCount: number;
  docId: string;
}

function getGoalKey(docId: string) {
  return `sable-goal-${docId}`;
}

export function WritingGoal({ wordCount, docId }: Props) {
  const [goal, setGoal] = useState(0);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(getGoalKey(docId));
    if (saved) setGoal(parseInt(saved, 10) || 0);
  }, [docId]);

  const progress = goal > 0 ? Math.min(wordCount / goal, 1) : 0;
  const percentage = Math.round(progress * 100);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - progress * circumference;

  function saveGoal() {
    const val = parseInt(inputVal, 10);
    if (val > 0) {
      setGoal(val);
      localStorage.setItem(getGoalKey(docId), String(val));
    }
    setEditing(false);
    setInputVal('');
  }

  if (goal === 0 && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all"
      >
        <span className="material-symbols-outlined text-ink/60 group-hover:text-primary transition-colors">flag</span>
        <span className="absolute -top-10 right-0 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Set Goal
        </span>
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-white border-2 border-ink rounded-full shadow-hard px-3 py-1.5">
        <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
        <input
          type="number"
          placeholder="Words..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
          className="w-20 text-sm font-body bg-transparent outline-none text-ink placeholder:text-ink/30"
          autoFocus
          min={1}
        />
        <button
          onClick={saveGoal}
          className="text-xs font-display font-bold text-primary hover:text-ink transition-colors"
        >
          Set
        </button>
        <button
          onClick={() => { setEditing(false); setInputVal(''); }}
          className="text-ink/30 hover:text-ink transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all"
      title={`${wordCount} / ${goal} words`}
    >
      {/* Radial progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-ink/10"
        />
        <circle
          cx="24" cy="24" r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-500 ${percentage >= 100 ? 'text-primary' : 'text-lavender'}`}
        />
      </svg>
      <span className="font-mono text-[10px] font-bold text-ink/70 z-10">{percentage}%</span>
      <span className="absolute -top-10 right-0 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {wordCount}/{goal} words
      </span>
    </button>
  );
}
