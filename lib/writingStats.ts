import { generateId } from './documents';

const STORAGE_KEY = 'sable_writing_stats';

export interface DailyStats {
  date: string;          // "YYYY-MM-DD"
  wordsWritten: number;  // total new words added that day
  sessions: number;      // number of editor opens
  hourlyWords: number[]; // 24 slots (index 0 = midnight, 23 = 11pm)
}

export type StatsMap = Record<string, DailyStats>;

// ─── Persistence ─────────────────────────────────────────────

export function loadStats(): StatsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StatsMap) : {};
  } catch {
    return {};
  }
}

export function saveStats(stats: StatsMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    console.error('Failed to save writing stats');
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function currentHour(): number {
  return new Date().getHours(); // 0–23
}

function emptyDay(date: string): DailyStats {
  return {
    date,
    wordsWritten: 0,
    sessions: 0,
    hourlyWords: new Array(24).fill(0),
  };
}

// ─── Recording ───────────────────────────────────────────────

export function recordActivity(wordsDelta: number): void {
  if (wordsDelta <= 0) return;
  const stats = loadStats();
  const key = todayKey();
  const day = stats[key] ?? emptyDay(key);

  day.wordsWritten += wordsDelta;
  day.hourlyWords[currentHour()] += wordsDelta;
  stats[key] = day;
  saveStats(stats);
}

export function recordSession(): void {
  const stats = loadStats();
  const key = todayKey();
  const day = stats[key] ?? emptyDay(key);
  day.sessions += 1;
  stats[key] = day;
  saveStats(stats);
}

// ─── Computed stats ──────────────────────────────────────────

export function getCurrentStreak(): number {
  const stats = loadStats();
  let streak = 0;
  const d = new Date();

  // Check if today has activity — if not, start from yesterday
  const todayStats = stats[todayKey()];
  if (!todayStats || todayStats.wordsWritten === 0) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const key = d.toISOString().slice(0, 10);
    const day = stats[key];
    if (day && day.wordsWritten > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getLongestStreak(): number {
  const stats = loadStats();
  const dates = Object.keys(stats)
    .filter((k) => stats[k].wordsWritten > 0)
    .sort();

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getTotalWords(): number {
  const stats = loadStats();
  return Object.values(stats).reduce((sum, d) => sum + d.wordsWritten, 0);
}

export function getTotalDays(): number {
  const stats = loadStats();
  return Object.values(stats).filter((d) => d.wordsWritten > 0).length;
}

export function getBestHours(): { hour: number; words: number }[] {
  const stats = loadStats();
  const hourly = new Array(24).fill(0);

  for (const day of Object.values(stats)) {
    for (let h = 0; h < 24; h++) {
      hourly[h] += day.hourlyWords[h] || 0;
    }
  }

  return hourly.map((words, hour) => ({ hour, words }));
}

/** Build the activity data array for react-activity-calendar (last 365 days) */
export function getCalendarData(): { date: string; count: number; level: number }[] {
  const stats = loadStats();
  const data: { date: string; count: number; level: number }[] = [];
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  start.setDate(start.getDate() + 1);

  // Find max for level calculation
  let maxWords = 1;
  for (const day of Object.values(stats)) {
    if (day.wordsWritten > maxWords) maxWords = day.wordsWritten;
  }

  const d = new Date(start);
  while (d <= end) {
    const key = d.toISOString().slice(0, 10);
    const day = stats[key];
    const count = day?.wordsWritten ?? 0;

    // Level 0–4 based on relative intensity
    let level = 0;
    if (count > 0) {
      const ratio = count / maxWords;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    data.push({ date: key, count, level });
    d.setDate(d.getDate() + 1);
  }

  return data;
}
