export interface Snapshot {
  id: string;
  content: string;
  savedAt: string;
  wordCount: number;
  preview: string;
}

const MAX_SNAPSHOTS = 25;
const HISTORY_PREFIX = 'sable_history_';

export function extractPlainText(json: string): string {
  try {
    const walk = (node: { type?: string; text?: string; content?: unknown[] }): string => {
      if (node.type === 'text') return node.text ?? '';
      if (node.content) return (node.content as { type?: string; text?: string; content?: unknown[] }[]).map(walk).join(' ');
      return '';
    };
    return walk(JSON.parse(json));
  } catch {
    return '';
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function loadSnapshots(docId: string): Snapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${docId}`);
    return raw ? (JSON.parse(raw) as Snapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(docId: string, content: string): void {
  if (typeof window === 'undefined') return;
  try {
    const text = extractPlainText(content);
    const snapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      content,
      savedAt: new Date().toISOString(),
      wordCount: countWords(text),
      preview: text.trim().slice(0, 120),
    };
    const existing = loadSnapshots(docId);
    const updated = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(`${HISTORY_PREFIX}${docId}`, JSON.stringify(updated));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. History snapshots not saved.');
      // Optionally notify user via a global notification system
    } else {
      console.error('Error saving snapshot:', error);
    }
  }
}

export function clearHistory(docId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${HISTORY_PREFIX}${docId}`);
}

export function relativeSnapshotTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday ' + new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
