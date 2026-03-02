'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tiptap/react';

export interface TiptapEditorRef {
  getHTML: () => string;
  getJSON: () => object;
  getWordCount: () => number;
  editor: Editor | null;
}

interface Props {
  content: string; // Tiptap JSON string
  onChange: (json: string, html: string) => void;
  onEditorReady?: (editor: Editor) => void;
  fontSize: number;
  lineSpacing: number;
  focusMode: boolean;
  readOnly?: boolean;
}

const TiptapEditor = forwardRef<TiptapEditorRef, Props>(function TiptapEditor(
  { content, onChange, onEditorReady, fontSize, lineSpacing, focusMode, readOnly = false },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start something wonderful…',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    content: (() => {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    })(),
    editable: !readOnly,
    onCreate({ editor }) {
      onEditorReady?.(editor);
    },
    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()), editor.getHTML());
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? '',
    getJSON: () => editor?.getJSON() ?? {},
    getWordCount: () => editor?.storage?.characterCount?.words() ?? 0,
    editor: editor ?? null,
  }));

  // When the document changes externally (e.g. new doc loaded), reset content
  useEffect(() => {
    if (!editor) return;
    const newJson = (() => {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    })();
    // Only update if the content actually differs to avoid cursor jumps
    const current = JSON.stringify(editor.getJSON());
    if (current !== content) {
      editor.commands.setContent(newJson, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const bubbleMenuItems = [
    {
      label: 'Bold',
      icon: 'format_bold',
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold') ?? false,
    },
    {
      label: 'Italic',
      icon: 'format_italic',
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic') ?? false,
    },
    {
      label: 'H1',
      icon: 'format_h1',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor?.isActive('heading', { level: 1 }) ?? false,
    },
    {
      label: 'H2',
      icon: 'format_h2',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive('heading', { level: 2 }) ?? false,
    },
    {
      label: 'H3',
      icon: 'format_h3',
      action: () =>
        editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor?.isActive('heading', { level: 3 }) ?? false,
    },
  ];

  return (
    <div
      className={`relative transition-all duration-300 ${
        focusMode ? 'focus-mode-active' : ''
      }`}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
        >
          <div className="flex items-center bg-ink text-white rounded-rough shadow-xl px-3 py-1.5 gap-1">
            {bubbleMenuItems.map((item) => (
              <button
                key={item.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  item.action();
                }}
                className={`p-1.5 rounded transition-colors hover:text-mint ${
                  item.isActive() ? 'text-mint' : 'text-white'
                }`}
                aria-label={item.label}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </button>
            ))}

            <div className="w-px h-4 bg-gray-600 mx-1" />

            {/* Annotation / comment highlight */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHighlight().run();
              }}
              className={`p-1.5 rounded transition-colors hover:text-peach ${
                editor.isActive('highlight') ? 'text-peach' : 'text-white'
              }`}
              aria-label="Annotate — highlight text"
            >
              <span className="material-symbols-outlined text-[18px]">
                comment
              </span>
            </button>

            {/* Link */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-1.5 rounded transition-colors hover:text-mint ${
                editor.isActive('link') ? 'text-mint' : 'text-white'
              }`}
              aria-label="Add link"
            >
              <span className="material-symbols-outlined text-[18px]">
                link
              </span>
            </button>

            {/* Arrow indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink" />
          </div>
        </BubbleMenu>
      )}

      <EditorContent
        editor={editor}
        className="tiptap-editor w-full outline-none"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineSpacing,
        }}
      />
    </div>
  );
});

export default TiptapEditor;
