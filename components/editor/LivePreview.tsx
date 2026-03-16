'use client';

interface Props {
  html: string;
  fontSize: number;
  lineSpacing: number;
}

export function LivePreview({ html, fontSize, lineSpacing }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-canvas dark:bg-background-dark border-l border-ink/10">
      <div className="sticky top-0 z-10 bg-canvas/80 dark:bg-background-dark/80 backdrop-blur-sm px-4 py-2 border-b border-ink/10">
        <span className="font-marker text-sm text-gray-500 dark:text-gray-400">Live Preview</span>
      </div>
      <div
        className="tiptap-editor px-8 py-6 pointer-events-none select-none text-ink"
        style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
        dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-400 dark:text-gray-500">Nothing to preview yet…</p>' }}
      />
    </div>
  );
}
