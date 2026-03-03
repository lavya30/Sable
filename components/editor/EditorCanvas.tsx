'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@tiptap/react';
import gsap from 'gsap';
import { useDocuments } from '@/context/DocumentsContext';
import { useSettings } from '@/context/SettingsContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeystrokeSounds } from '@/hooks/useKeystrokeSounds';
import { useWritingTracker } from '@/hooks/useWritingTracker';
import TiptapEditor, { TiptapEditorRef } from './TiptapEditor';
import { LivePreview } from './LivePreview';
import { EditorToolbar } from './EditorToolbar';
import { SketchpadPanel } from './SketchpadPanel';
import { MoodBoardPanel } from './MoodBoardPanel';
import { MarginNoteGutter } from './MarginNoteGutter';
import { PublishModal } from './PublishModal';
import { SettingsOverlay } from './SettingsOverlay';
import { WordCountBadge } from './WordCountBadge';
import { MarginNote } from '@/lib/types';

interface Props {
  docId: string;
}

export function EditorCanvas({ docId }: Props) {
  const router = useRouter();
  const { getDoc, updateDoc } = useDocuments();
  const { settings } = useSettings();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [html, setHtml] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSketchpad, setShowSketchpad] = useState(false);
  const [showMoodBoard, setShowMoodBoard] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const editorRef = useRef<TiptapEditorRef>(null);
  const mainRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const doc = getDoc(docId);

  // GSAP page entrance animation
  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(mainRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1, overwrite: true }
      );
    }
    if (footerRef.current) {
      gsap.fromTo(footerRef.current.children,
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)', delay: 0.5, overwrite: true }
      );
    }
  }, []);

  // Redirect if document is missing or deleted
  useEffect(() => {
    if (doc === undefined) return; // still loading from localStorage hydration
    if (!doc || doc.isDeleted) {
      router.replace('/');
    }
  }, [doc, router]);

  // Debounced save â€” uses latest updateDoc via the fnRef pattern in useDebounce
  const debouncedSave = useDebounce((json: string) => {
    updateDoc(docId, { content: json });
  }, 800);

  // Keystroke sounds
  useKeystrokeSounds(editor, settings.keystrokeSounds, settings.keystrokeVolume);

  // Writing activity tracking
  useWritingTracker(editor);

  if (!doc || doc.isDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="font-marker text-xl text-gray-400">Loadingâ€¦</p>
      </div>
    );
  }

  function handleEditorChange(json: string, htmlContent: string) {
    setHtml(htmlContent);
    debouncedSave(json);
  }

  function handleNotesChange(notes: string) {
    updateDoc(docId, { notes });
  }

  function handleMoodBoardChange(moodBoard: import('@/lib/types').MoodBoardItem[]) {
    updateDoc(docId, { moodBoard });
  }

  function handleMarginNotesChange(marginNotes: MarginNote[]) {
    updateDoc(docId, { marginNotes });
  }

  function getExportHTML(): string {
    return editorRef.current?.getHTML() ?? html;
  }

  return (
    <div
      className={`text-ink font-body min-h-screen flex flex-col relative overflow-x-hidden selection:bg-mint selection:text-ink transition-all duration-300 ${focusMode ? 'focus-mode-active' : ''
        } ${settings.theme === 'dark'
          ? 'bg-background-dark'
          : 'bg-canvas'
        }`}
    >
      {/* â”€â”€ Auto-hiding toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <EditorToolbar
        editor={editor}
        onSketchpadToggle={() => setShowSketchpad(true)}
        onMoodBoardToggle={() => setShowMoodBoard(true)}
        onPublishOpen={() => setShowPublish(true)}
        focusMode={focusMode}
        showPreview={showPreview}
        onPreviewToggle={() => setShowPreview((v) => !v)}
        docTitle={doc.title}
      />

      {/* â”€â”€ Main editing area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main ref={mainRef} className="flex-grow flex pt-20 pb-28">
        {/* Editor + margin notes wrapper */}
        <div className={`transition-all duration-300 flex justify-center w-full ${showPreview ? '' : 'px-6 sm:px-12'}`}>
          {/* Left spacer for symmetry (matches gutter width) */}
          {!showPreview && <div className="w-56 flex-shrink-0 hidden xl:block" />}

          {/* Editor pane */}
          <div
            className={`transition-all duration-300 overflow-y-auto ${showPreview
              ? 'w-1/2 px-8 border-r-2 border-ink/10'
              : 'w-full max-w-[720px]'
              }`}
          >
            <div className="relative">
              <TiptapEditor
                ref={editorRef}
                content={doc.content}
                onChange={handleEditorChange}
                onEditorReady={(e) => {
                  setEditor(e);
                  setHtml(e.getHTML());
                }}
                fontSize={settings.fontSize}
                lineSpacing={settings.lineSpacing}
                focusMode={focusMode}
              />
            </div>
          </div>

          {/* Margin notes gutter – sits beside the editor */}
          {editor && !showPreview && (
            <div className="w-56 flex-shrink-0 relative hidden xl:block">
              <MarginNoteGutter
                editor={editor}
                marginNotes={doc.marginNotes ?? []}
                onChange={handleMarginNotesChange}
              />
            </div>
          )}
        </div>

        {/* Preview pane */}
        {showPreview && (
          <div className="w-1/2 bg-background-light dark:bg-background-dark border-l-2 border-ink/10 overflow-hidden">
            <LivePreview
              html={html}
              fontSize={settings.fontSize}
              lineSpacing={settings.lineSpacing}
            />
          </div>
        )}
      </main>

      {/* â”€â”€ Right-edge sketchpad trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!focusMode && !showSketchpad && (
        <div
          className="fixed top-0 right-0 bottom-0 w-5 z-30 flex items-center justify-center cursor-pointer hover:bg-ink/5 transition-colors focus-hidden"
          onClick={() => setShowSketchpad(true)}
          title="Open Sketchpad"
        >
          <div className="h-16 w-1 bg-ink/20 rounded-full hover:h-24 hover:bg-ink/40 transition-all duration-300" />
        </div>
      )}

      {/* â”€â”€ Bottom-right controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer ref={footerRef} className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
        <div className="focus-hidden">
          <WordCountBadge editor={editor} />
        </div>

        {/* Focus mode toggle */}
        <button
          onClick={() => setFocusMode((v) => !v)}
          aria-label={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-white border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all"
        >
          <span
            className={`material-symbols-outlined transition-colors ${focusMode ? 'text-lavender' : 'group-hover:text-lavender'
              }`}
          >
            {focusMode ? 'visibility_off' : 'visibility'}
          </span>
          <span className="absolute -top-10 right-0 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </span>
        </button>

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Settings"
          className="btn-magnetic group relative flex items-center justify-center w-12 h-12 bg-ink text-white border-2 border-ink rounded-rough-sm shadow-hard hover:shadow-hard-hover transition-all"
        >
          <span className="material-symbols-outlined group-hover:rotate-45 transition-transform duration-300">
            settings
          </span>
        </button>
      </footer>

      {/* â”€â”€ Overlays / Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SketchpadPanel
        isOpen={showSketchpad}
        onClose={() => setShowSketchpad(false)}
        notes={doc.notes}
        onNotesChange={handleNotesChange}
        editor={editor}
        docId={docId}
      />

      <MoodBoardPanel
        isOpen={showMoodBoard}
        onClose={() => setShowMoodBoard(false)}
        items={doc.moodBoard ?? []}
        onChange={handleMoodBoardChange}
      />

      <PublishModal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        doc={doc}
        getHTML={getExportHTML}
      />

      <SettingsOverlay
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
