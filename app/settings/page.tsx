'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import { exportAllData, importAllData } from '@/lib/backup';
import { FeedbackModal } from '@/components/FeedbackModal';

type SettingsTab = 'general' | 'editor' | 'about';

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'tune' },
  { id: 'editor', label: 'Editor', icon: 'edit_note' },
  { id: 'about', label: 'About', icon: 'info' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <div className="bg-canvas text-ink font-body min-h-screen">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-canvas/80 backdrop-blur-md border-b border-ink/8">
        <div className="max-w-[820px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors font-display text-sm group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Library
          </Link>

          <h1 className="font-heading font-bold text-lg tracking-tight">Settings</h1>

          <div className="w-16" /> {/* spacer for centering */}
        </div>

        {/* Tab bar */}
        <div className="max-w-[820px] mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold transition-colors rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-ink'
                    : 'text-ink/35 hover:text-ink/60'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="max-w-[820px] mx-auto px-6 py-8">
        {activeTab === 'general' && <GeneralTab settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'editor' && <EditorTab settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'about' && <AboutTab />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  General Tab                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TabProps {
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings'];
  updateSettings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['updateSettings'];
}

function GeneralTab({ settings, updateSettings }: TabProps) {
  return (
    <div className="space-y-8">
      {/* Privacy banner */}
      <div className="relative bg-[#0d2b20] rounded-2xl p-7 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">shield</span>
            <h3 className="font-heading font-bold text-lg">Your notebook, your rules</h3>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-lg">
            Sable keeps everything on this device. No tracking, no analytics, no cloud
            — only the quiet reflection you choose to write.
          </p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: 'visibility_off', title: 'Zero telemetry', desc: 'Nothing leaves your device unless you export', color: 'bg-mint/15 border-mint/30' },
          { icon: 'hard_drive', title: 'Local storage', desc: 'Your data lives in the browser. You own every byte', color: 'bg-lavender/15 border-lavender/30' },
          { icon: 'spa', title: 'Calm workspace', desc: 'No productivity pressure, no streak counters', color: 'bg-peach/15 border-peach/30' },
          { icon: 'wifi_off', title: 'Offline ready', desc: 'Works without internet, always accessible', color: 'bg-rose/15 border-rose/30' },
        ].map((item) => (
          <div key={item.title} className={`${item.color} border rounded-xl px-4 py-3.5 flex items-start gap-3`}>
            <span className="material-symbols-outlined text-[20px] text-ink/50 mt-0.5 shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <p className="font-display font-bold text-[13px] text-ink">{item.title}</p>
              <p className="text-[11px] text-ink/40 leading-snug mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex gap-3">
          <ThemeCard
            label="Day"
            icon="light_mode"
            active={settings.theme === 'light'}
            onClick={() => updateSettings({ theme: 'light' })}
            preview="bg-white"
            iconColor="text-amber-500"
          />
          <ThemeCard
            label="Night"
            icon="dark_mode"
            active={settings.theme === 'dark'}
            onClick={() => updateSettings({ theme: 'dark' })}
            preview="bg-[#1a2e23]"
            iconColor="text-indigo-400"
          />
        </div>
      </Section>

      {/* Data Management */}
      <Section title="Data">
        <div className="flex gap-3">
          <button
            onClick={exportAllData}
            className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border border-ink/10 bg-white hover:border-ink/20 hover:shadow-sm transition-all group"
          >
            <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform">download</span>
            <div className="text-left">
              <p className="font-display font-semibold text-sm">Export</p>
              <p className="text-[11px] text-ink/35">Download all notebooks</p>
            </div>
          </button>
          <ImportButton />
        </div>
      </Section>
    </div>
  );
}

function ImportButton() {
  const [error, setError] = useState('');
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      await importAllData(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <label className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border border-ink/10 bg-white hover:border-ink/20 hover:shadow-sm transition-all cursor-pointer group">
      <span className="material-symbols-outlined text-[20px] text-lavender group-hover:scale-110 transition-transform">upload</span>
      <div className="text-left">
        <p className="font-display font-semibold text-sm">Import</p>
        <p className={`text-[11px] ${error ? 'text-red-500' : 'text-ink/35'}`}>{error || 'Restore from backup'}</p>
      </div>
      <input type="file" accept=".json" className="hidden" onChange={handleImport} />
    </label>
  );
}

function ThemeCard({ label, icon, active, onClick, preview, iconColor }: {
  label: string; icon: string; active: boolean; onClick: () => void; preview: string; iconColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border transition-all ${
        active
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-ink/10 bg-white hover:border-ink/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg ${preview} border border-ink/10 flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
      </div>
      <div className="text-left">
        <p className="font-display font-semibold text-sm">{label}</p>
        <p className="text-[11px] text-ink/35">{active ? 'Active' : 'Switch'}</p>
      </div>
      {active && (
        <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check_circle</span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Editor Tab                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EditorTab({ settings, updateSettings }: TabProps) {
  return (
    <div className="space-y-8">
      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-5">
          <SettingsSlider
            label="Text Size"
            value={`${settings.fontSize}px`}
            min={16}
            max={32}
            step={1}
            sliderValue={settings.fontSize}
            onChange={(v) => updateSettings({ fontSize: v })}
            leftLabel="Small"
            rightLabel="Large"
            icon="format_size"
          />
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
        </div>
      </Section>

      {/* Sounds */}
      <Section title="Keystroke Sounds">
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'off', label: 'Off', icon: 'volume_off' },
            { key: 'typewriter', label: 'Typewriter', icon: 'keyboard' },
            { key: 'mechanical', label: 'Mechanical', icon: 'piano' },
            { key: 'pen', label: 'Pen', icon: 'edit' },
          ] as const).map((theme) => (
            <button
              key={theme.key}
              onClick={() => updateSettings({ keystrokeSounds: theme.key })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all ${
                settings.keystrokeSounds === theme.key
                  ? 'bg-primary/10 border-primary/40 text-ink'
                  : 'border-ink/10 text-ink/40 hover:border-ink/20 hover:text-ink/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
              {theme.label}
            </button>
          ))}
        </div>

        {settings.keystrokeSounds !== 'off' && (
          <div className="mt-4">
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
            />
          </div>
        )}
      </Section>

      {/* Preview */}
      <Section title="Preview">
        <div className="rounded-xl border border-ink/10 bg-white p-6 overflow-hidden">
          <p
            className="text-ink leading-relaxed transition-all duration-300"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineSpacing }}
          >
            The old man sat by the window, watching the rain trace silver paths down the glass.
            Each drop carried a memory — some sharp, some blurred by time.
          </p>
        </div>
        <p className="text-[11px] text-ink/30 mt-2 text-center font-marker">Live preview of your editor settings</p>
      </Section>
    </div>
  );
}

function SettingsSlider({ label, value, min, max, step, sliderValue, onChange, leftLabel, rightLabel, icon }: {
  label: string; value: string; min: number; max: number; step: number;
  sliderValue: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string; icon: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-ink/30">{icon}</span>
          <span className="font-display font-semibold text-sm text-ink">{label}</span>
        </div>
        <span className="font-mono text-xs text-primary font-bold bg-primary/8 px-2.5 py-1 rounded-lg">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-primary"
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-ink/25 mt-1 px-0.5">
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* App identity */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-mint/30 border border-primary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[32px]">edit_note</span>
        </div>
        <div>
          <h3 className="font-heading font-bold text-2xl text-ink">Sable</h3>
          <p className="text-sm text-ink/40 font-body mt-0.5">
            A calm, distraction-free writing space for writers who value privacy.
          </p>
          <p className="text-xs text-ink/25 font-mono mt-1">v1.0.0</p>
        </div>
      </div>

      {/* Built with */}
      <Section title="Built With">
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Next.js', color: 'bg-ink/5' },
            { name: 'TipTap', color: 'bg-primary/8' },
            { name: 'Tailwind CSS', color: 'bg-blue-50' },
            { name: 'GSAP', color: 'bg-green-50' },
            { name: 'Electron', color: 'bg-indigo-50' },
          ].map((tech) => (
            <span
              key={tech.name}
              className={`${tech.color} px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold text-ink/60 border border-ink/5`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Feedback">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-ink/10 bg-white hover:border-ink/20 hover:shadow-sm transition-all group"
        >
          <span className="material-symbols-outlined text-[20px] text-ink/30 group-hover:text-ink/50 transition-colors">chat_bubble</span>
          <div className="text-left flex-1">
            <p className="font-display font-semibold text-sm text-ink">Send feedback</p>
            <p className="text-[11px] text-ink/35">Share thoughts or report an issue</p>
          </div>
          <span className="material-symbols-outlined text-[16px] text-ink/20 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </button>
      </Section>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-ink/5 mt-8">
        <p className="font-marker text-sm text-ink/40 mb-2">
          Made with ♥ for writers who think best in quiet
        </p>
        <p className="font-display text-xs text-ink/30">
          Created by <span className="font-bold text-ink/50">Lavya</span> and <span className="font-bold text-ink/50">Shlok</span>
        </p>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Shared Components                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="font-display font-bold text-xs uppercase tracking-widest text-ink/30 mb-3">{title}</h4>
      {children}
    </section>
  );
}
