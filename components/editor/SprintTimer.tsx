'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  onSprintComplete?: (wordsWritten: number) => void;
  currentWordCount: number;
}

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
];

export function SprintTimer({ onSprintComplete, currentWordCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [startWordCount, setStartWordCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sprintWords, setSprintWords] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completeSprint = useCallback(() => {
    const written = Math.max(0, currentWordCount - startWordCount);
    setSprintWords(written);
    setIsRunning(false);
    setShowResults(true);
    onSprintComplete?.(written);

    // Fire confetti 🎉
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#13ec75', '#A7F3D0', '#DDD6FE', '#FDBA74', '#FDA4AF'],
    });
  }, [currentWordCount, startWordCount, onSprintComplete]);

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          completeSprint();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, completeSprint]);

  function startSprint(minutes: number) {
    setTotalTime(minutes * 60);
    setTimeLeft(minutes * 60);
    setStartWordCount(currentWordCount);
    setIsRunning(true);
    setShowResults(false);
    setIsOpen(false);
  }

  function cancelSprint() {
    setIsRunning(false);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - progress * circumference;

  // Sprint in progress — show timer
  if (isRunning) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={cancelSprint}
          className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all"
          title="Cancel sprint"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-ink/10" />
            <circle
              cx="24" cy="24" r="18"
              fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="font-mono text-[9px] font-bold text-ink z-10">{formatTime(timeLeft)}</span>
        </button>
      </div>
    );
  }

  // Sprint results
  if (showResults) {
    return (
      <div className="flex items-center gap-2 bg-white border-2 border-ink rounded-full shadow-hard px-4 py-2">
        <span className="material-symbols-outlined text-primary text-[18px]">emoji_events</span>
        <span className="font-display font-bold text-sm text-ink">{sprintWords} words!</span>
        <button
          onClick={() => setShowResults(false)}
          className="text-ink/30 hover:text-ink ml-1"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    );
  }

  // Sprint picker
  if (isOpen) {
    return (
      <div className="flex items-center gap-2 bg-white border-2 border-ink rounded-full shadow-hard px-3 py-1.5">
        <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
        {PRESETS.map((p) => (
          <button
            key={p.minutes}
            onClick={() => startSprint(p.minutes)}
            className="px-2.5 py-1 text-xs font-display font-bold rounded-full bg-primary/10 hover:bg-primary/25 text-ink transition-colors"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setIsOpen(false)}
          className="text-ink/30 hover:text-ink transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    );
  }

  // Default — sprint trigger button
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all"
    >
      <span className="material-symbols-outlined text-ink/60 group-hover:text-primary transition-colors">timer</span>
      <span className="absolute -top-10 right-0 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Sprint
      </span>
    </button>
  );
}
