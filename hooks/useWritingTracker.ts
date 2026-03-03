'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { recordActivity, recordSession } from '@/lib/writingStats';

/**
 * Tracks word count changes in the editor and records writing activity.
 * Accumulates word deltas and flushes to storage periodically.
 */
export function useWritingTracker(editor: Editor | null) {
  const prevWordsRef = useRef<number>(-1); // -1 = not initialized
  const accumulatedDeltaRef = useRef<number>(0);
  const sessionRecordedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const delta = accumulatedDeltaRef.current;
    if (delta > 0) {
      recordActivity(delta);
      accumulatedDeltaRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (!editor) return;

    // Record a session open on first mount
    if (!sessionRecordedRef.current) {
      sessionRecordedRef.current = true;
      recordSession();
    }

    function handleUpdate() {
      if (!editor) return;

      // Count words from editor text content (more reliable than characterCount storage)
      const text = editor.getText();
      const newWords = text.trim() ? text.trim().split(/\s+/).length : 0;

      // Initialize baseline on first update
      if (prevWordsRef.current < 0) {
        prevWordsRef.current = newWords;
        return;
      }

      const delta = newWords - prevWordsRef.current;
      prevWordsRef.current = newWords;

      // Only track positive deltas (new words added, not deletions)
      if (delta > 0) {
        accumulatedDeltaRef.current += delta;

        // Clear existing timer and set new one
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, 2000);

        // Flush immediately for large writes (paste)
        if (accumulatedDeltaRef.current > 20) {
          if (timerRef.current) clearTimeout(timerRef.current);
          flush();
        }
      }
    }

    // Initialize baseline word count
    const text = editor.getText();
    prevWordsRef.current = text.trim() ? text.trim().split(/\s+/).length : 0;

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      // Flush any accumulated delta on cleanup (e.g., navigating away)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      flush();
    };
  }, [editor, flush]);
}
