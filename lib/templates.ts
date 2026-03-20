// Pre-defined JSON content templates for Tiptap

export type TemplateId = 'blank' | 'journal' | 'essay' | 'story' | 'meeting';

export interface DocumentTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  content: object;
}

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Note',
    description: 'Start fresh with a completely empty canvas.',
    icon: 'format_clear',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    },
  },
  {
    id: 'journal',
    name: 'Daily Journal',
    description: 'Record your thoughts, gratitude, and daily reflections.',
    icon: 'book',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Daily Journal' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What I did today' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What I learned' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Gratitude' }] },
        { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [] }] },
          ]
        },
      ],
    },
  },
  {
    id: 'essay',
    name: 'Essay / Article',
    description: 'A structured layout for long-form writing and arguments.',
    icon: 'article',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title of the Essay' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Introduction.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Argument 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Argument 2' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conclusion' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
      ],
    },
  },
  {
    id: 'story',
    name: 'Short Story',
    description: 'A creative writing layout focusing on characters and plot.',
    icon: 'history_edu',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Story Title' }] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A brief logline or premise.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Characters' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Chapter 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
      ],
    },
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Capture attendees, agendas, and action items effortlessly.',
    icon: 'groups',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Title' }] },
        { type: 'paragraph', content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Date:' },
            { type: 'text', text: ' ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Attendees:' },
          ]
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }] },
      ],
    },
  },
];
