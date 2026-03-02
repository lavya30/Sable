import { Suspense } from 'react';
import EditorPageClient from './EditorPageClient';

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas">
          <p className="font-marker text-xl text-gray-400">Opening notebook…</p>
        </div>
      }
    >
      <EditorPageClient />
    </Suspense>
  );
}
