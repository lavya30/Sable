import { Extension } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: string; // 'continue' | 'rewrite' | 'summarize' | 'brainstorm'
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Continue Writing',
    description: 'AI continues your text',
    icon: 'auto_awesome',
    command: 'continue',
  },
  {
    title: 'Rewrite',
    description: 'Rewrite the paragraph above',
    icon: 'edit_note',
    command: 'rewrite',
  },
  {
    title: 'Summarize',
    description: 'Summarize your content',
    icon: 'summarize',
    command: 'summarize',
  },
  {
    title: 'Fix Grammar',
    description: 'Fix grammar issues',
    icon: 'spellcheck',
    command: 'fix_grammar',
  },
];

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: new PluginKey('slashCommand'),
        command: ({ editor, range, props }: { editor: unknown; range: unknown; props: SlashCommandItem }) => {
          // This will be handled by the render function
          // The props contain the selected command
          void props;
          void editor;
          void range;
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
