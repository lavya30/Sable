'use client';

interface Props {
  html: string;
  fontSize: number;
  lineSpacing: number;
}

export function LivePreview({ html, fontSize, lineSpacing }: Props) {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-sm px-4 py-2 border-b border-ink/10">
        <span className="font-marker text-sm text-gray-500">Live Preview</span>
      </div>
      <div
        className="tiptap-editor px-8 py-6 pointer-events-none select-none"
        style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
        dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-300">Nothing to preview yet…</p>' }}
      />
    </div>
  );
}
