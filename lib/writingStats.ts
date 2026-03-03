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
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StatsMap;

    // Migration: ensure every day has a valid hourlyWords array of length 24
    for (const key of Object.keys(parsed)) {
      const day = parsed[key];
      if (!Array.isArray(day.hourlyWords) || day.hourlyWords.length !== 24) {
        day.hourlyWords = new Array(24).fill(0);
      }
      if (typeof day.wordsWritten !== 'number') day.wordsWritten = 0;
      if (typeof day.sessions !== 'number') day.sessions = 0;
    }

    return parsed;
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

/** Returns today's date key in YYYY-MM-DD using local timezone */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns a date key in YYYY-MM-DD using local timezone */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

/** Adds N days to a date (mutates nothing, returns new date) */
function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

/** Difference in calendar days between two dates (local timezone aware) */
function daysBetween(a: Date, b: Date): number {
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bDate.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Recording ───────────────────────────────────────────────

export function recordActivity(wordsDelta: number): void {
  if (wordsDelta <= 0 || !isFinite(wordsDelta)) return;
  const stats = loadStats();
  const key = todayKey();
  const day = stats[key] ?? emptyDay(key);

  day.wordsWritten += Math.floor(wordsDelta);
  day.hourlyWords[currentHour()] += Math.floor(wordsDelta);
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
  const today = new Date();
  const d = new Date(today);

  // Check if today has activity — if not, start from yesterday
  const todayStats = stats[todayKey()];
  if (!todayStats || todayStats.wordsWritten === 0) {
    d.setDate(d.getDate() - 1);
  }

  // Walk backwards day by day
  for (let i = 0; i < 3650; i++) {
    const key = dateKey(d);
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
    const prev = new Date(dates[i - 1] + 'T00:00:00');  // ensure local parse
    const curr = new Date(dates[i] + 'T00:00:00');
    const diff = daysBetween(prev, curr);

    if (diff === 1) {
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
    if (!Array.isArray(day.hourlyWords)) continue;
    for (let h = 0; h < 24; h++) {
      hourly[h] += day.hourlyWords[h] || 0;
    }
  }

  return hourly.map((words, hour) => ({ hour, words }));
}

/**
 * Build the activity data array for react-activity-calendar.
 * Covers the full last year, starting from the same weekday as today
 * (matching GitHub's behavior).
 */
export function getCalendarData(): { date: string; count: number; level: number }[] {
  const stats = loadStats();
  const data: { date: string; count: number; level: number }[] = [];

  const today = new Date();
  // Start from ~1 year ago, snapped to the same weekday as today
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);
  // Go to the next occurrence of that same weekday
  // (react-activity-calendar expects first entry to be a Sunday)
  start.setDate(start.getDate() - start.getDay());

  // Find max for level calculation (only consider data in range)
  let maxWords = 0;
  const d = new Date(start);
  while (d <= today) {
    const key = dateKey(d);
    const day = stats[key];
    if (day && day.wordsWritten > maxWords) {
      maxWords = day.wordsWritten;
    }
    d.setDate(d.getDate() + 1);
  }
  if (maxWords === 0) maxWords = 1; // avoid division by zero

  // Generate entries
  const iter = new Date(start);
  while (iter <= today) {
    const key = dateKey(iter);
    const day = stats[key];
    const count = day?.wordsWritten ?? 0;

    // Level 0–4 based on relative intensity (quartile-style)
    let level = 0;
    if (count > 0) {
      const ratio = count / maxWords;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    data.push({ date: key, count, level });
    iter.setDate(iter.getDate() + 1);
  }

  return data;
}
