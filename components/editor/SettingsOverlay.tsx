'use client';

import { useEffect, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsOverlay({ isOpen, onClose }: Props) {
  const { settings, updateSettings } = useSettings();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed bottom-24 right-8 z-50 w-72 origin-bottom-right"
    >
      <div className="relative bg-white text-ink border-2 border-ink shadow-hard rounded-tl-lg rounded-tr-lg rounded-bl-wobble rounded-br-wobble torn-paper-top p-6 flex flex-col gap-6">
        {/* Tape decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-mint/30 rotate-1 skew-x-12 z-20 pointer-events-none border border-white/40" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-gray-200 pb-2 mt-2">
          <h3 className="font-marker text-2xl font-bold tracking-wide -rotate-1">
            Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex justify-between items-center font-marker text-lg">
            <span>Text Size</span>
            <span className="text-primary font-bold">{settings.fontSize}px</span>
          </div>
          <div className="relative h-10 flex items-center">
            {/* Wobbly SVG track */}
            <svg
              className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 pointer-events-none overflow-visible"
              preserveAspectRatio="none"
            >
              <path
                d="M0,8 Q30,6 60,8 T120,8 T180,8 T240,8"
                fill="none"
                stroke="#2D3436"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
            <input
              type="range"
              min={16}
              max={32}
              value={settings.fontSize}
              onChange={(e) =>
                updateSettings({ fontSize: parseInt(e.target.value, 10) })
              }
              className="relative z-10 w-full"
              aria-label="Font size"
            />
          </div>
          <div className="flex justify-between text-xs font-marker text-gray-400 px-1">
            <span>Small</span>
            <span>Huge</span>
          </div>
        </div>

        {/* Line Spacing */}
        <div className="space-y-3">
          <div className="flex justify-between items-center font-marker text-lg">
            <span>Line Spacing</span>
            <span className="text-primary font-bold">{settings.lineSpacing.toFixed(1)}</span>
          </div>
          <div className="relative h-10 flex items-center">
            <svg
              className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 pointer-events-none overflow-visible"
              preserveAspectRatio="none"
            >
              <path
                d="M0,8 Q30,6 60,8 T120,8 T180,8 T240,8"
                fill="none"
                stroke="#2D3436"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={Math.round(settings.lineSpacing * 10)}
              onChange={(e) =>
                updateSettings({ lineSpacing: parseInt(e.target.value, 10) / 10 })
              }
              className="relative z-10 w-full"
              aria-label="Line spacing"
            />
          </div>
          <div className="flex justify-between text-xs font-marker text-gray-400 px-1">
            <span>Tight</span>
            <span>Airy</span>
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-3 pt-1">
          <div className="font-marker text-lg flex items-center gap-2">
            <span>Vibe</span>
            <span className="material-symbols-outlined text-sm text-primary">
              auto_awesome
            </span>
          </div>
          <div className="flex gap-6">
            {/* Day */}
            <label className="cursor-pointer flex flex-col items-center gap-1">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => updateSettings({ theme: 'light' })}
                className="sr-only peer"
              />
              <div className="w-12 h-12 bg-white border-2 border-ink rounded-full flex items-center justify-center peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 shadow-sm transition-all">
                <span className="material-symbols-outlined text-ink">
                  light_mode
                </span>
              </div>
              <span className="font-marker text-sm text-ink">Day</span>
            </label>

            {/* Night */}
            <label className="cursor-pointer flex flex-col items-center gap-1">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => updateSettings({ theme: 'dark' })}
                className="sr-only peer"
              />
              <div className="w-12 h-12 bg-ink border-2 border-ink rounded-full flex items-center justify-center peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 shadow-sm transition-all">
                <span className="material-symbols-outlined text-white">
                  dark_mode
                </span>
              </div>
              <span className="font-marker text-sm text-ink">Night</span>
            </label>
          </div>
        </div>

        {/* Keystroke Sounds */}
        <div className="space-y-3 pt-1">
          <div className="font-marker text-lg flex items-center gap-2">
            <span>Keystroke Sounds</span>
            <span className="material-symbols-outlined text-sm text-primary">
              music_note
            </span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {([
              { value: 'off', icon: 'volume_off', label: 'Off' },
              { value: 'typewriter', icon: 'keyboard', label: 'Typewriter' },
              { value: 'mechanical', icon: 'keyboard_keys', label: 'Mechanical' },
              { value: 'pen', icon: 'edit', label: 'Pen' },
            ] as const).map(({ value, icon, label }) => (
              <label key={value} className="cursor-pointer flex flex-col items-center gap-1">
                <input
                  type="radio"
                  name="keystrokeSounds"
                  value={value}
                  checked={settings.keystrokeSounds === value}
                  onChange={() => updateSettings({ keystrokeSounds: value })}
                  className="sr-only peer"
                />
                <div className="w-11 h-11 bg-white border-2 border-ink/20 rounded-lg flex items-center justify-center peer-checked:border-ink peer-checked:bg-primary/20 peer-checked:shadow-hard-sm transition-all hover:border-ink/40">
                  <span className="material-symbols-outlined text-ink text-[18px]">
                    {icon}
                  </span>
                </div>
                <span className="font-marker text-[10px] text-gray-500">{label}</span>
              </label>
            ))}
          </div>
          {settings.keystrokeSounds !== 'off' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="material-symbols-outlined text-sm text-gray-400">volume_down</span>
              <input
                type="range"
                min={0}
                max={10}
                value={Math.round(settings.keystrokeVolume * 10)}
                onChange={(e) =>
                  updateSettings({ keystrokeVolume: parseInt(e.target.value, 10) / 10 })
                }
                className="flex-1"
                aria-label="Keystroke volume"
              />
              <span className="material-symbols-outlined text-sm text-gray-400">volume_up</span>
            </div>
          )}
        </div>

        {/* Version */}
        <div className="text-center">
          <p className="font-marker text-xs text-gray-400 rotate-1">
            Sable v1.0 • Made with ☕
          </p>
        </div>
      </div>
    </div>
  );
}
