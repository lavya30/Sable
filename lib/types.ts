export type MoodBoardItemType = 'image' | 'color' | 'link' | 'note';

export interface MoodBoardItem {
  id: string;
  type: MoodBoardItemType;
  content: string;   // data-URL (image), hex (color), URL (link), or text (note)
  label: string;     // user caption
  createdAt: string;
}

export interface MarginNote {
  id: string;
  /** Paragraph index (0-based) in the document */
  paragraphIndex: number;
  content: string;
  color: 'peach' | 'lavender' | 'mint' | 'rose';
  /** Slight random rotation for hand-placed feel (-3 to 3 deg) */
  rotation: number;
  createdAt: string;
}

export type CoverColor = 'mint' | 'lavender' | 'peach' | 'rose';

export interface SableDocument {
  id: string;
  title: string;
  content: string; // Tiptap JSON (stringified)
  coverColor: CoverColor;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isDeleted: boolean;
  isFavorited: boolean;
  isArchived: boolean;
  notes: string; // scratchpad side notes
  moodBoard: MoodBoardItem[];
  marginNotes: MarginNote[];
  tags: string[];
}

export type LibraryTab = 'recent' | 'favorites' | 'archived';
export type SortOrder = 'asc' | 'desc';
export type ExportFormat = 'pdf' | 'markdown' | 'html' | 'zine';
