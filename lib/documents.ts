import { SableDocument, CoverColor } from './types';
import { TemplateId, TEMPLATES } from './templates';

const STORAGE_KEY = 'sable_documents';

const COVER_COLORS: CoverColor[] = ['mint', 'lavender', 'peach', 'rose'];

export function randomCoverColor(): CoverColor {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

export function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadDocuments(): SableDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SableDocument[]) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(docs: SableDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    console.error('Failed to save documents to localStorage');
  }
}

export function createDocument(templateId: TemplateId = 'blank'): SableDocument {
  const now = new Date().toISOString();
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

  return {
    id: generateId(),
    title: 'Untitled',
    content: JSON.stringify(template.content),
    coverColor: randomCoverColor(),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    isFavorited: false,
    isArchived: false,
    notes: '',
    moodBoard: [],
    marginNotes: [],
    tags: [],
  };
}

/** Extract plain-text preview from Tiptap JSON string */
export function extractTextPreview(contentJson: string, maxChars = 160): string {
  try {
    const doc = JSON.parse(contentJson) as { content?: unknown[] };
    let text = '';

    function traverse(node: unknown): void {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (typeof n.text === 'string') text += n.text + ' ';
      if (Array.isArray(n.content)) {
        (n.content as unknown[]).forEach(traverse);
      }
    }

    traverse(doc);
    const trimmed = text.trim();
    return trimmed.length > maxChars
      ? trimmed.slice(0, maxChars) + '…'
      : trimmed;
  } catch {
    return '';
  }
}

/** Relative time label */
export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}
