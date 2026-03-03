'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { recordActivity, recordSession } from '@/lib/writingStats';

/**
 * Tracks word count changes in the editor and records writing activity.
 * Debounces updates to avoid thrashing localStorage.
 */
export function useWritingTracker(editor: Editor | null) {
  const prevWordsRef = useRef<number>(0);
  const sessionRecordedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback((delta: number) => {
    if (delta > 0) {
      recordActivity(delta);
    }
  }, []);

  useEffect(() => {
    if (!editor) return;

    // Record a session open on first mount
    if (!sessionRecordedRef.current) {
      sessionRecordedRef.current = true;
      recordSession();
    }

    // Initialize baseline word count
    const currentWords: number = editor.storage?.characterCount?.words?.() ?? 0;
    prevWordsRef.current = currentWords;

    function handleUpdate() {
      const newWords: number = editor!.storage?.characterCount?.words?.() ?? 0;
      const delta = newWords - prevWordsRef.current;
      prevWordsRef.current = newWords;

      if (delta > 0) {
        // Debounce: accumulate deltas and flush every 3 seconds
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => flush(delta), 3000);

        // But also flush immediately for big writes (paste)
        if (delta > 20) {
          if (timerRef.current) clearTimeout(timerRef.current);
          flush(delta);
        }
      }
    }

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      // Flush any pending delta on cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, flush]);
}
