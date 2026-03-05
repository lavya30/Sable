'use client';

import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'editor' | 'about';

const TABS: { id: SettingsTab; label: string; icon: string; desc: string }[] = [
  { id: 'general', label: 'General', icon: 'tune', desc: 'Privacy & philosophy' },
  { id: 'editor', label: 'Editor', icon: 'edit_note', desc: 'Fonts, spacing & sounds' },
  { id: 'about', label: 'About', icon: 'info', desc: 'Version & credits' },
];

export function SettingsOverlay({ isOpen, onClose }: Props) {
  const { settings, updateSettings } = useSettings();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-[780px] max-w-[92vw] h-[520px] max-h-[85vh] bg-white border-2 border-ink rounded-2xl shadow-hard-lg flex overflow-hidden"
      >
        {/* ── Sidebar ────────────────────────────────────────── */}
        <div className="w-[200px] flex-shrink-0 bg-surface border-r-2 border-ink/10 flex flex-col p-4 gap-1">
          <div className="flex items-center gap-2 mb-5 px-2">
            <span className="material-symbols-outlined text-primary text-[22px]">settings</span>
            <h2 className="font-heading font-bold text-base tracking-tight uppercase text-ink/50">Settings</h2>
          </div>

          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${activeTab === tab.id
                  ? 'bg-white border-2 border-ink/15 shadow-hard-sm text-ink'
                  : 'border-2 border-transparent text-ink/50 hover:text-ink hover:bg-white/60'
                }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-primary' : ''
                }`}>{tab.icon}</span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm leading-tight">{tab.label}</p>
                <p className="text-[10px] text-ink/40 leading-tight truncate">{tab.desc}</p>
              </div>
            </button>
          ))}

          <div className="flex-1" />
          <p className="text-[10px] font-marker text-ink/25 px-2 text-center">Sable v1.0</p>
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-ink/40 hover:text-ink transition-colors z-10"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {activeTab === 'general' && <GeneralTab settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'editor' && <EditorTab settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  General Tab                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GeneralTab({ settings, updateSettings }: {
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings'];
  updateSettings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['updateSettings'];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-2xl text-ink">General</h3>
        <p className="text-sm text-ink/40 font-body mt-0.5">Privacy & philosophy</p>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0a3d2e] to-[#1a5c44] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-[28px]">shield</span>
            <div>
              <h4 className="font-heading font-bold text-lg leading-tight">Your notebook, your rules</h4>
              <p className="text-white/60 text-xs font-body">Everything stays on your device</p>
            </div>
          </div>
          <p className="text-white/50 text-sm font-body mt-3 leading-relaxed">
            Sable keeps everything rooted on this device. No tracking, no analytics, no cloud
            — only the quiet reflection you choose to write.
          </p>
        </div>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <FeatureCard
          icon="visibility_off"
          title="Zero telemetry"
          desc="No analytics or tracking. Nothing leaves your device unless you export."
          color="bg-mint/20"
          iconColor="text-[#059669]"
        />
        <FeatureCard
          icon="hard_drive"
          title="Local storage"
          desc="Your data lives right here in the browser. You own every byte."
          color="bg-lavender/20"
          iconColor="text-[#7c3aed]"
        />
        <FeatureCard
          icon="spa"
          title="Calm workspace"
          desc="Designed for reflection. No productivity pressure, no streak counters."
          color="bg-peach/20"
          iconColor="text-[#d97706]"
        />
        <FeatureCard
          icon="wifi_off"
          title="Offline ready"
          desc="Works without internet. Your writing is always accessible."
          color="bg-rose/20"
          iconColor="text-[#e11d48]"
        />
      </div>

      {/* Theme */}
      <div className="border-t-2 border-dashed border-ink/10 pt-5">
        <h4 className="font-display font-bold text-sm uppercase tracking-wider text-ink/40 mb-3">Appearance</h4>
        <div className="flex gap-3">
          <ThemeCard
            label="Day"
            icon="light_mode"
            active={settings.theme === 'light'}
            onClick={() => updateSettings({ theme: 'light' })}
            bg="bg-white border-ink/15"
            iconColor="text-amber-500"
          />
          <ThemeCard
            label="Night"
            icon="dark_mode"
            active={settings.theme === 'dark'}
            onClick={() => updateSettings({ theme: 'dark' })}
            bg="bg-[#1a2e23] border-[#2d5443]"
            iconColor="text-indigo-300"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, iconColor }: {
  icon: string; title: string; desc: string; color: string; iconColor: string;
}) {
  return (
    <div className={`${color} rounded-xl p-4 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start gap-3">
        <span className={`material-symbols-outlined text-[22px] ${iconColor} mt-0.5`}>{icon}</span>
        <div>
          <p className="font-display font-bold text-sm text-ink leading-tight">{title}</p>
          <p className="text-xs text-ink/50 font-body mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ label, icon, active, onClick, bg, iconColor }: {
  label: string; icon: string; active: boolean; onClick: () => void; bg: string; iconColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${bg} ${active
          ? 'ring-2 ring-primary ring-offset-2 shadow-hard-sm'
          : 'hover:shadow-hard-sm'
        }`}
    >
      <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>{icon}</span>
      <span className="font-display font-semibold text-sm">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Editor Tab                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EditorTab({ settings, updateSettings }: {
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings'];
  updateSettings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['updateSettings'];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-2xl text-ink">Editor</h3>
        <p className="text-sm text-ink/40 font-body mt-0.5">Fonts, spacing & sounds</p>
      </div>

      {/* Font Size */}
      <SettingsSlider
        label="Text Size"
        value={`${settings.fontSize}px`}
        min={16}
        max={32}
        step={1}
        sliderValue={settings.fontSize}
        onChange={(v) => updateSettings({ fontSize: v })}
        leftLabel="Small"
        rightLabel="Huge"
        icon="format_size"
      />

      {/* Line Spacing */}
      <SettingsSlider
        label="Line Spacing"
        value={settings.lineSpacing.toFixed(1)}
        min={14}
        max={22}
        step={1}
        sliderValue={Math.round(settings.lineSpacing * 10)}
        onChange={(v) => updateSettings({ lineSpacing: v / 10 })}
        leftLabel="Tight"
        rightLabel="Airy"
        icon="format_line_spacing"
      />

      {/* Keystroke Sounds */}
      <div className="border-t-2 border-dashed border-ink/10 pt-5">
        <h4 className="font-display font-bold text-sm uppercase tracking-wider text-ink/40 mb-3">Keystroke Sounds</h4>
        <div className="flex gap-2 flex-wrap">
          {(['off', 'typewriter', 'mechanical', 'soft'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => updateSettings({ keystrokeSounds: theme })}
              className={`px-4 py-2 rounded-xl border-2 font-display text-sm font-semibold transition-all capitalize ${settings.keystrokeSounds === theme
                  ? 'bg-primary/15 border-primary text-ink shadow-hard-sm'
                  : 'border-ink/10 text-ink/50 hover:border-ink/30 hover:text-ink'
                }`}
            >
              {theme === 'off' ? '🔇 Off' : theme === 'typewriter' ? '⌨️ Typewriter' : theme === 'mechanical' ? '🎹 Mechanical' : '🤫 Soft'}
            </button>
          ))}
        </div>

        {settings.keystrokeSounds !== 'off' && (
          <div className="mt-3">
            <SettingsSlider
              label="Volume"
              value={`${Math.round(settings.keystrokeVolume * 100)}%`}
              min={0}
              max={100}
              step={5}
              sliderValue={Math.round(settings.keystrokeVolume * 100)}
              onChange={(v) => updateSettings({ keystrokeVolume: v / 100 })}
              leftLabel="Quiet"
              rightLabel="Loud"
              icon="volume_up"
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSlider({ label, value, min, max, step, sliderValue, onChange, leftLabel, rightLabel, icon, compact }: {
  label: string; value: string; min: number; max: number; step: number;
  sliderValue: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string; icon: string; compact?: boolean;
}) {
  return (
    <div className={`${compact ? '' : 'bg-surface rounded-xl p-4'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-ink/40">{icon}</span>
          <span className="font-display font-semibold text-sm text-ink">{label}</span>
        </div>
        <span className="font-mono text-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] font-marker text-ink/30 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  About Tab                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AboutTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-2xl text-ink">About</h3>
        <p className="text-sm text-ink/40 font-body mt-0.5">Version & credits</p>
      </div>

      {/* Version Card */}
      <div className="bg-gradient-to-br from-primary/10 to-mint/20 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-primary text-[28px]">edit_note</span>
          <div>
            <h4 className="font-heading font-bold text-xl text-ink">Sable</h4>
            <p className="text-xs text-ink/40 font-mono">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-ink/60 font-body leading-relaxed">
          A calm, distraction-free writing space designed for writers who value
          privacy and the joy of putting thoughts to paper.
        </p>
      </div>

      {/* Credits */}
      <div className="bg-surface rounded-xl p-5">
        <h4 className="font-display font-bold text-sm uppercase tracking-wider text-ink/40 mb-3">Made With</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Next.js', icon: '⚡' },
            { name: 'TipTap', icon: '✍️' },
            { name: 'Tailwind CSS', icon: '🎨' },
            { name: 'GSAP', icon: '🎬' },
          ].map((tech) => (
            <div key={tech.name} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-ink/5">
              <span className="text-base">{tech.icon}</span>
              <span className="font-display text-xs font-semibold text-ink/60">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="font-marker text-sm text-ink/30 leading-relaxed">
          Made with ♥ for writers who think best in quiet
        </p>
      </div>
    </div>
  );
}
