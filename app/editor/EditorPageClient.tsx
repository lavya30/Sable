'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EditorCanvas } from '@/components/editor/EditorCanvas';

export default function EditorPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get('id');

  useEffect(() => {
    if (!docId) {
      router.replace('/');
    }
  }, [docId, router]);

  if (!docId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="font-marker text-xl text-gray-400">
          No document selected.
        </p>
      </div>
    );
  }

  return <EditorCanvas docId={docId} />;
}
