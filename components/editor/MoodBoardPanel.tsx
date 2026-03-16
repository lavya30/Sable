'use client';

import { useState, useRef, useEffect } from 'react';
import { MoodBoardItem, MoodBoardItemType } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: MoodBoardItem[];
  onChange: (items: MoodBoardItem[]) => void;
}

function generateItemId(): string {
  return `mb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const ADD_BUTTONS: { type: MoodBoardItemType; icon: string; label: string }[] = [
  { type: 'image', icon: 'image', label: 'Image' },
  { type: 'color', icon: 'palette', label: 'Color' },
  { type: 'link', icon: 'link', label: 'Link' },
  { type: 'note', icon: 'edit_note', label: 'Note' },
];

export function MoodBoardPanel({ isOpen, onClose, items, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLabel, setNoteLabel] = useState('');

  // Color modal state
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorValue, setColorValue] = useState('#13ec75');

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function addItem(type: MoodBoardItemType, content: string, label: string) {
    const newItem: MoodBoardItem = {
      id: generateItemId(),
      type,
      content,
      label,
      createdAt: new Date().toISOString(),
    };
    onChange([newItem, ...items]);
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function handleAddClick(type: MoodBoardItemType) {
    switch (type) {
      case 'image':
        fileInputRef.current?.click();
        break;
      case 'color':
        setColorValue('#13ec75');
        setShowColorModal(true);
        break;
      case 'link':
        setLinkUrl('');
        setLinkLabel('');
        setShowLinkModal(true);
        break;
      case 'note':
        setNoteText('');
        setNoteLabel('');
        setShowNoteModal(true);
        break;
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addItem('image', reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleColorSubmit() {
    addItem('color', colorValue, colorValue);
    setShowColorModal(false);
  }

  function handleLinkSubmit() {
    if (!linkUrl.trim()) return;
    addItem('link', linkUrl.trim(), linkLabel.trim() || linkUrl.trim());
    setShowLinkModal(false);
  }

  function handleNoteSubmit() {
    if (!noteText.trim()) return;
    addItem('note', noteText.trim(), noteLabel.trim() || 'Note');
    setShowNoteModal(false);
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[400px] bg-white sketch-border border-l-0 shadow-[4px_0_0_#2D3436] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="absolute inset-0 bg-dot-grid-sketch opacity-[0.05] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink/10 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">dashboard</span>
              Mood Board
            </h2>
            <span className="text-sm font-marker text-gray-500 -rotate-1 inline-block">Pin your inspiration</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-ink">close</span>
          </button>
        </div>

        {/* Add buttons row */}
        <div className="px-5 pt-4 pb-2 flex gap-2 relative z-10">
          {ADD_BUTTONS.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => handleAddClick(type)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-ink/15 bg-white hover:border-ink hover:-translate-y-0.5 hover:shadow-hard-sm transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[20px] text-gray-500 group-hover:text-primary transition-colors">{icon}</span>
              <span className="text-[10px] font-marker text-gray-500 group-hover:text-ink transition-colors">{label}</span>
            </button>
          ))}
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Cards area — masonry columns */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 relative z-10">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <span className="material-symbols-outlined text-5xl text-gray-300">dashboard_customize</span>
              <p className="font-marker text-gray-400 text-sm max-w-[200px]">
                Pin images, colors, links &amp; notes to build your mood board.
              </p>
            </div>
          ) : (
            <div className="columns-2 gap-3 [column-fill:_balance]">
              {items.map((item) => (
                <MoodCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-ink/10 bg-white relative z-10 flex items-center justify-between">
          <span className="text-xs font-marker text-gray-600">
            {items.length} {items.length === 1 ? 'pin' : 'pins'}
          </span>
          {items.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs font-marker text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Color picker modal */}
      {showColorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
          <div className="absolute inset-0" onClick={() => setShowColorModal(false)} />
          <div className="relative w-full max-w-xs bg-white border-[3px] border-ink rounded-wobble shadow-hard-lg p-6 z-10 flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-ink">Pick a Color</h3>

            {/* Live preview swatch */}
            <div
              className="w-full h-24 rounded-xl border-2 border-ink/20 shadow-hard-sm transition-colors duration-100"
              style={{ backgroundColor: colorValue }}
            />

            {/* Native color picker — fills full width */}
            <input
              type="color"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              className="w-full h-10 rounded-lg border-2 border-ink/20 cursor-pointer bg-white p-0.5"
            />

            {/* Hex label */}
            <p className="font-mono text-sm text-gray-700 text-center tracking-widest uppercase">
              {colorValue}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowColorModal(false)}
                className="px-4 py-2 text-sm font-marker text-gray-700 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleColorSubmit}
                className="px-4 py-2 bg-ink text-white text-sm font-display font-bold rounded-lg hover:bg-primary hover:text-ink transition-all border-2 border-ink"
              >
                Pin it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
          <div className="absolute inset-0" onClick={() => setShowLinkModal(false)} />
          <div className="relative w-full max-w-sm bg-white border-[3px] border-ink rounded-wobble shadow-hard-lg p-6 z-10 flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-ink">Add Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
              className="w-full border-2 border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white"
              autoFocus
            />
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label (optional)"
              onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
              className="w-full border-2 border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-sm font-marker text-gray-700 hover:text-ink transition-colors">Cancel</button>
              <button onClick={handleLinkSubmit} className="px-4 py-2 bg-ink text-white text-sm font-display font-bold rounded-lg hover:bg-primary hover:text-ink transition-all border-2 border-ink">Pin it</button>
            </div>
          </div>
        </div>
      )}

      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
          <div className="absolute inset-0" onClick={() => setShowNoteModal(false)} />
          <div className="relative w-full max-w-sm bg-white border-[3px] border-ink rounded-wobble shadow-hard-lg p-6 z-10 flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-ink">Add Note</h3>
            <input
              type="text"
              value={noteLabel}
              onChange={(e) => setNoteLabel(e.target.value)}
              placeholder="Title (optional)"
              className="w-full border-2 border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white"
              autoFocus
            />
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Your inspiration note..."
              rows={4}
              className="w-full border-2 border-ink/20 rounded-lg px-3 py-2 text-sm font-body text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary bg-white resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 text-sm font-marker text-gray-700 hover:text-ink transition-colors">Cancel</button>
              <button onClick={handleNoteSubmit} className="px-4 py-2 bg-ink text-white text-sm font-display font-bold rounded-lg hover:bg-primary hover:text-ink transition-all border-2 border-ink">Pin it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Individual card ────────────────────────────────────────── */

function MoodCard({ item, onRemove }: { item: MoodBoardItem; onRemove: () => void }) {
  const baseClass =
    'relative break-inside-avoid mb-3 rounded-xl border-2 border-ink/15 bg-white overflow-hidden group hover:-translate-y-0.5 hover:shadow-hard-sm transition-all';

  const deleteBtn = (
    <button
      onClick={onRemove}
      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-ink/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300"
    >
      <span className="material-symbols-outlined text-[14px] text-gray-500 hover:text-red-500">close</span>
    </button>
  );

  switch (item.type) {
    case 'image':
      return (
        <div className={baseClass}>
          <img src={item.content} alt={item.label} className="w-full object-cover" style={{ maxHeight: 200 }} />
          {item.label && (
            <div className="px-3 py-2 border-t border-ink/10">
              <span className="text-xs font-marker text-gray-500 line-clamp-1">{item.label}</span>
            </div>
          )}
          {deleteBtn}
        </div>
      );

    case 'color':
      return (
        <div className={baseClass}>
          <div className="h-24 w-full rounded-t-xl" style={{ backgroundColor: item.content }} />
          <div className="px-3 py-2 border-t border-ink/10 flex items-center justify-between">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{item.content}</span>
            <div className="w-4 h-4 rounded-full border-2 border-ink/20" style={{ backgroundColor: item.content }} />
          </div>
          {deleteBtn}
        </div>
      );

    case 'link':
      return (
        <div className={baseClass}>
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0">link</span>
            <div className="min-w-0">
              <div className="text-sm font-display font-bold text-ink line-clamp-2">{item.label}</div>
              <div className="text-xs font-mono text-gray-400 truncate mt-0.5">{item.content}</div>
            </div>
          </a>
          {deleteBtn}
        </div>
      );

    case 'note':
      return (
        <div className={`${baseClass} bg-peach/30`}>
          <div className="p-3">
            {item.label && item.label !== 'Note' && (
              <div className="text-xs font-display font-bold text-ink mb-1">{item.label}</div>
            )}
            <p className="text-sm font-marker text-ink/80 whitespace-pre-wrap leading-relaxed">{item.content}</p>
          </div>
          {deleteBtn}
        </div>
      );
  }
}
