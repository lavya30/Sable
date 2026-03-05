'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

/* ─── React Component for the Image Node View ──────────────────────────── */

function ResizableImageView({ node, updateAttributes, deleteNode, selected }: {
  node: { attrs: { src: string; alt: string; title: string; width: number | null; alignment: string } };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
  selected: boolean;
}) {
  const { src, alt, width, alignment } = node.attrs;
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.offsetWidth ?? 400;
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(100, Math.min(startWidth.current + diff, 800));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateAttributes]);

  const justifyClass =
    alignment === 'center' ? 'justify-center' :
      alignment === 'right' ? 'justify-end' :
        'justify-start';

  return (
    <NodeViewWrapper
      className={`flex my-4 ${justifyClass}`}
      data-drag-handle
    >
      <div
        className={`relative inline-block group ${isResizing ? '' : 'transition-all duration-200'}`}
        style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%' }}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => { if (!isResizing) setShowToolbar(false); }}
      >
        {/* The image */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          draggable={false}
          className={`w-full h-auto rounded-lg border-2 transition-colors duration-200 ${selected
            ? 'border-primary shadow-[4px_4px_0_rgba(19,236,117,0.2)]'
            : 'border-ink/10 hover:border-mint'
            }`}
        />

        {/* Hover toolbar */}
        {(showToolbar || selected) && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-ink text-white rounded-lg shadow-xl px-2 py-1 z-20">
            {/* Alignment buttons */}
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                onClick={() => updateAttributes({ alignment: a })}
                className={`p-1 rounded transition-colors ${alignment === a ? 'text-mint' : 'text-white/70 hover:text-white'
                  }`}
                title={`Align ${a}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {a === 'left' ? 'format_align_left' : a === 'center' ? 'format_align_center' : 'format_align_right'}
                </span>
              </button>
            ))}

            <div className="w-px h-4 bg-white/30 mx-0.5" />

            {/* Delete button */}
            <button
              onClick={deleteNode}
              className="p-1 rounded text-white/70 hover:text-red-400 transition-colors"
              title="Delete image"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        )}

        {/* Resize handle — bottom-right corner */}
        {(showToolbar || selected) && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border-2 border-primary rounded-full cursor-se-resize z-20 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            title="Drag to resize"
          >
            <span className="material-symbols-outlined text-primary text-[12px]">open_in_full</span>
          </div>
        )}

        {/* Width indicator while resizing */}
        {isResizing && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/80 text-white text-xs font-marker px-2 py-0.5 rounded z-20">
            {Math.round(width ?? imgRef.current?.offsetWidth ?? 0)}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/* ─── Custom Image Extension with Node View ─────────────────────────────── */

export const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      alignment: { default: 'center' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    // @ts-expect-error — ReactNodeViewRenderer type mismatch with function components
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string }) => ({ commands }: { commands: { insertContent: (content: Record<string, unknown>) => boolean } }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
