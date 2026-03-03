'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useSettings } from '@/context/SettingsContext';
import { useAmbientSound, AMBIENT_SOUNDS } from '@/hooks/useAmbientSound';

/**
 * Compact floating ambient-sound player that sits in the editor.
 * Expands on click to reveal sound choices + volume slider.
 */
export function AmbientPlayer() {
  const { settings, updateSettings } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const { isPlaying } = useAmbientSound(settings.ambientSound, settings.ambientVolume);

  const panelRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    if (expanded) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  // GSAP entrance for the panel
  useEffect(() => {
    if (expanded && pillRef.current) {
      gsap.fromTo(pillRef.current,
        { scale: 0.9, opacity: 0, y: 8 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)', overwrite: true }
      );
    }
  }, [expanded]);

  const currentSound = AMBIENT_SOUNDS.find(s => s.value === settings.ambientSound) ?? AMBIENT_SOUNDS[0];

  return (
    <div ref={panelRef} className="relative focus-hidden">
      {/* Toggle pill */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`btn-magnetic group relative flex items-center gap-2 h-12 px-4 border-2 border-ink rounded-full shadow-hard hover:shadow-hard-hover transition-all ${
          isPlaying
            ? 'bg-lavender/40 border-ink'
            : 'bg-white'
        }`}
        aria-label="Ambient sounds"
      >
        <span className={`material-symbols-outlined text-[20px] transition-colors ${
          isPlaying ? 'text-ink ambient-pulse' : 'text-gray-400 group-hover:text-ink'
        }`}>
          {isPlaying ? 'graphic_eq' : 'music_note'}
        </span>
        {isPlaying && (
          <span className="font-marker text-xs text-ink/70 hidden sm:inline">
            {currentSound.label}
          </span>
        )}
        {/* Tooltip */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink text-white text-xs px-2 py-1 rounded font-marker opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ambient Sounds
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          ref={pillRef}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-white border-2 border-ink rounded-xl shadow-hard p-4 flex flex-col gap-4"
        >
          {/* Title */}
          <div className="flex items-center justify-between">
            <h4 className="font-marker text-base text-ink flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">headphones</span>
              Ambient Vibes
            </h4>
            {isPlaying && (
              <div className="flex gap-0.5 items-end h-4">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full ambient-bar"
                    style={{
                      height: `${8 + Math.random() * 10}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sound choices */}
          <div className="grid grid-cols-3 gap-2">
            {AMBIENT_SOUNDS.map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ ambientSound: value })}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all hover:-translate-y-0.5 ${
                  settings.ambientSound === value
                    ? 'bg-primary/20 border-ink shadow-hard-sm'
                    : 'bg-white border-ink/20 hover:border-ink/40 hover:shadow-hard-sm'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${
                  settings.ambientSound === value ? 'text-ink' : 'text-gray-400'
                }`}>
                  {icon}
                </span>
                <span className="font-marker text-[10px] text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Volume slider */}
          {settings.ambientSound !== 'off' && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-gray-400">volume_down</span>
              <input
                type="range"
                min={0}
                max={10}
                value={Math.round(settings.ambientVolume * 10)}
                onChange={(e) =>
                  updateSettings({ ambientVolume: parseInt(e.target.value, 10) / 10 })
                }
                className="flex-1 accent-primary"
                aria-label="Ambient volume"
              />
              <span className="material-symbols-outlined text-[16px] text-gray-400">volume_up</span>
            </div>
          )}

          {/* Tip */}
          <p className="text-[10px] font-marker text-gray-400 text-center">
            Add MP3s to public/sounds/ folder
          </p>
        </div>
      )}
    </div>
  );
}
