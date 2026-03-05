'use client';

import { useEffect, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface Props {
  status: SaveStatus;
}

export function AutoSaveIndicator({ status }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'saving' || status === 'saved') {
      setVisible(true);
    }

    if (status === 'saved') {
      const timer = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ink/10 shadow-hard-sm font-marker text-sm transition-all duration-500 ${status === 'saving'
          ? 'bg-peach/80 text-ink'
          : 'bg-mint/80 text-ink'
        } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
    >
      {status === 'saving' ? (
        <>
          <span className="inline-block w-3 h-3 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
          Saved
        </>
      )}
    </div>
  );
}
