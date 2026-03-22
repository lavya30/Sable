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
      const target = e.target as HTMLElement;
      if (target.closest('[data-settings-trigger]')) return;
      if (overlayRef.current && !overlayRef.current.contains(target)) {
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
      className="fixed bottom-24 right-8 z-50 w-80 origin-bottom-right max-h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="relative bg-white text-ink border-2 border-ink shadow-hard rounded-tl-lg rounded-tr-lg rounded-bl-wobble rounded-br-wobble torn-paper-top p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1 min-h-0" data-lenis-prevent>
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

        {/* Snapshot Interval */}
        <div className="space-y-3">
          <div className="font-marker text-lg">Snapshot Interval</div>
          <p className="text-xs font-marker text-gray-400">Auto-saves a version every N minutes. Max 25 snapshots stored per document.</p>
          <div className="flex gap-2 flex-wrap">
            {[1, 5, 10, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => updateSettings({ snapshotInterval: mins })}
                className={`px-4 py-1.5 rounded-full border-2 font-marker text-sm transition-all ${
                  (settings.snapshotInterval ?? 5) === mins
                    ? 'bg-primary border-ink text-ink'
                    : 'border-ink/30 text-ink/60 hover:border-ink hover:text-ink'
                }`}
              >
                {mins}m
              </button>
            ))}
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

        {/* AI Assistant */}
        <div className="space-y-3 pt-1">
          <div className="font-marker text-lg flex items-center gap-2">
            <span>AI Assistant</span>
            <span className="material-symbols-outlined text-sm text-primary">
              smart_toy
            </span>
          </div>
          <p className="text-xs font-marker text-gray-400">
            Choose your provider and paste your API key. Your key is stored locally on this device only.
          </p>
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-marker text-gray-500">Provider</span>
              <select
                value={settings.aiProvider}
                onChange={(e) => updateSettings({ aiProvider: e.target.value as 'openai' | 'gemini' | 'claude' })}
                className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-marker focus:border-primary focus:outline-none transition-colors"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </label>

            {settings.aiProvider === 'openai' && (
              <>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">OpenAI API Key</span>
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => updateSettings({ openaiApiKey: e.target.value.trim() })}
                    placeholder="sk-..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-mono placeholder:text-gray-300 focus:border-primary focus:outline-none transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">Model</span>
                  <select
                    value={settings.openaiModel}
                    onChange={(e) => updateSettings({ openaiModel: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-marker focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (fast & cheap)</option>
                    <option value="gpt-4o">GPT-4o (balanced)</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4.1">GPT-4.1 (smartest)</option>
                  </select>
                </label>
              </>
            )}

            {settings.aiProvider === 'gemini' && (
              <>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">Gemini API Key</span>
                  <input
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => updateSettings({ geminiApiKey: e.target.value.trim() })}
                    placeholder="AIzaSy..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-mono placeholder:text-gray-300 focus:border-primary focus:outline-none transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">Model</span>
                  <select
                    value={settings.geminiModel}
                    onChange={(e) => updateSettings({ geminiModel: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-marker focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (fast & cheap)</option>
                    <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash (thinking)</option>
                    <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro (smartest)</option>
                  </select>
                </label>
              </>
            )}

            {settings.aiProvider === 'claude' && (
              <>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">Claude API Key</span>
                  <input
                    type="password"
                    value={settings.claudeApiKey}
                    onChange={(e) => updateSettings({ claudeApiKey: e.target.value.trim() })}
                    placeholder="sk-ant-..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-mono placeholder:text-gray-300 focus:border-primary focus:outline-none transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-marker text-gray-500">Model</span>
                  <select
                    value={settings.claudeModel}
                    onChange={(e) => updateSettings({ claudeModel: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink/20 bg-white text-ink text-sm font-marker focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (fast & cheap)</option>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (balanced)</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4 (smartest)</option>
                  </select>
                </label>
              </>
            )}
          </div>
          {(() => {
            const keyMap: Record<string, string> = { openai: settings.openaiApiKey, gemini: settings.geminiApiKey, claude: settings.claudeApiKey };
            const labelMap: Record<string, string> = { openai: 'OpenAI', gemini: 'Gemini', claude: 'Claude' };
            return keyMap[settings.aiProvider] ? (
              <p className="text-xs font-marker text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Key saved ({labelMap[settings.aiProvider]})
              </p>
            ) : null;
          })()}
        </div>

        {/* Version */}
        <div className="text-center">
          <p className="font-marker text-xs text-gray-400 rotate-1">
            Sable v1.0 • Made with love
          </p>
        </div>
      </div>
    </div>
  );
}
