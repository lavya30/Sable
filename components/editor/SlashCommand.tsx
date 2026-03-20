'use client';

import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { SLASH_COMMANDS, SlashCommandItem } from '@/lib/slash-command';

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (items[selectedIndex]) command(items[selectedIndex]);
        return true;
      }
      if (event.key === 'Escape') {
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="slash-menu">
      {items.map((item, index) => (
        <button
          key={item.command}
          onClick={() => command(item)}
          className={`slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="slash-icon">
            <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
          </div>
          <div>
            <div className="slash-label">{item.title}</div>
            <div className="slash-desc">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
});

export function createSlashSuggestion(onCommand: (command: string, context: string) => void) {
  return {
    items: ({ query }: { query: string }) => {
      return SLASH_COMMANDS.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.command.toLowerCase().includes(query.toLowerCase())
      );
    },

    render: () => {
      let component: ReactRenderer<SlashMenuRef> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          component = new ReactRenderer(SlashMenu, {
            props: {
              ...props,
              command: (item: SlashCommandItem) => {
                // Delete the slash command text
                props.editor
                  .chain()
                  .focus()
                  .deleteRange(props.range)
                  .run();

                // Get context (previous paragraph text)
                const { state } = props.editor;
                const { from } = state.selection;
                const $from = state.doc.resolve(from);
                let context = '';
                
                // Walk backwards to find text content
                for (let i = $from.depth; i > 0; i--) {
                  const parent = $from.node(i);
                  if (parent.textContent) {
                    context = parent.textContent;
                    break;
                  }
                }

                // If no text in current block, try previous block
                if (!context) {
                  const prevPos = Math.max(0, from - 2);
                  const $prev = state.doc.resolve(prevPos);
                  context = $prev.parent.textContent || '';
                }

                onCommand(item.command, context);
              },
            },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            offset: [0, 8],
          });
        },

        onUpdate(props: SuggestionProps<SlashCommandItem>) {
          component?.updateProps({
            ...props,
            command: (item: SlashCommandItem) => {
              props.editor
                .chain()
                .focus()
                .deleteRange(props.range)
                .run();

              const { state } = props.editor;
              const { from } = state.selection;
              const $from = state.doc.resolve(from);
              let context = '';
              for (let i = $from.depth; i > 0; i--) {
                const parent = $from.node(i);
                if (parent.textContent) {
                  context = parent.textContent;
                  break;
                }
              }
              if (!context) {
                const prevPos = Math.max(0, from - 2);
                const $prev = state.doc.resolve(prevPos);
                context = $prev.parent.textContent || '';
              }
              onCommand(item.command, context);
            },
          });

          if (!props.clientRect) return;
          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },

        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit() {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
