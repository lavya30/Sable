'use client';

import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor | null;
}

export function WordCountBadge({ editor }: Props) {
  const [words, setWords] = useState(0);

  useEffect(() => {
    if (!editor) return;

    function update() {
      const count = editor!.storage?.characterCount?.words?.() ?? 0;
      setWords(count);
    }

    // Update on every transaction
    editor.on('update', update);
    update(); // initial

    return () => {
      editor.off('update', update);
    };
  }, [editor]);

  return (
    <div className="bg-white border-2 border-ink rounded-rough-sm shadow-hard-sm px-4 py-2 rotate-1 hover:rotate-0 transition-transform cursor-default select-none">
      <span className="font-marker text-lg text-ink">
        {words} {words === 1 ? 'word' : 'words'}
      </span>
    </div>
  );
}
