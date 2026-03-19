'use client';

import { useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const minChars = 10;
  const remaining = minChars - message.length;

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('File too large. Max 20MB.');
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (message.length < minChars || status === 'sending') return;
    setStatus('sending');

    try {
      const res = await fetch('https://formsubmit.co/ajax/lavya.goel@somaiya.edu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: 'Sable App Feedback',
          _template: 'table',
          Rating: `${rating} / 5 ⭐`,
          Message: message,
          Screenshot: screenshot ? 'Screenshot attached (base64)' : 'None',
        }),
      });

      if (res.ok) {
        setStatus('sent');
        setTimeout(() => {
          setRating(0);
          setMessage('');
          setScreenshot(null);
          setScreenshotName('');
          setStatus('idle');
          onClose();
        }, 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        setScreenshotName(file.name || 'pasted-image.png');
        const reader = new FileReader();
        reader.onload = () => setScreenshot(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 cursor-pointer" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-[480px] max-w-[92vw] bg-white border-2 border-ink rounded-2xl shadow-hard-lg p-8 flex flex-col items-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 text-ink/40 hover:text-ink transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {status === 'sent' ? (
          /* ── Success State ────────────────────────── */
          <div className="py-8 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-[56px]">check_circle</span>
            <h3 className="font-heading font-bold text-2xl text-ink">Thank you!</h3>
            <p className="text-sm text-ink/50 font-body text-center">
              Your feedback has been sent. We appreciate it!
            </p>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────── */
          <>
            <h3 className="font-heading font-bold text-2xl text-ink text-center mb-1">
              We appreciate your feedback.
            </h3>
            <p className="text-sm text-ink/50 font-body text-center mb-6 max-w-[340px]">
              We are always looking for ways to improve your experience. Please take a moment to evaluate and tell us what you think.
            </p>

            {/* Star Rating */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill={(hoveredStar || rating) >= star ? '#FBBF24' : 'none'}
                    stroke={(hoveredStar || rating) >= star ? '#FBBF24' : '#CBD5E1'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What can we do to improve your experience? (Emojis welcome! 🎉)"
              rows={4}
              className="w-full border-2 border-ink/10 rounded-xl px-4 py-3 text-sm font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary/50 resize-none transition-colors mb-1"
            />
            {remaining > 0 && (
              <p className="text-xs text-ink/30 font-body self-start mb-4">
                {remaining} more character{remaining !== 1 ? 's' : ''} needed
              </p>
            )}
            {remaining <= 0 && <div className="mb-4" />}

            {/* Screenshot Upload */}
            <div className="w-full mb-6">
              <p className="font-display font-bold text-sm text-ink mb-2">Screenshot (Optional)</p>
              <div
                onClick={() => fileRef.current?.click()}
                onPaste={handlePaste}
                tabIndex={0}
                className="w-full border-2 border-dashed border-ink/15 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer hover:border-ink/30 hover:bg-surface transition-all"
              >
                {screenshot ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={screenshot} alt="Screenshot preview" className="max-h-24 rounded-lg border border-ink/10" />
                    <span className="text-xs text-ink/40 font-body">{screenshotName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshot(null);
                        setScreenshotName('');
                      }}
                      className="text-xs text-red-400 hover:text-red-500 font-display font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[28px] text-ink/25 mb-1">upload</span>
                    <p className="text-sm font-body text-ink/50">Click to upload or paste image</p>
                    <p className="text-[10px] font-body text-ink/25 mt-0.5">PNG, JPEG, GIF, WebP (max 20MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleScreenshot}
              />
            </div>

            {/* Error message */}
            {status === 'error' && (
              <p className="text-xs text-red-500 font-body mb-3 self-start">
                Failed to send. Please check your internet connection and try again.
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={message.length < minChars || status === 'sending'}
              className="w-full py-3.5 bg-ink text-white font-display font-bold text-base rounded-xl hover:bg-primary hover:text-ink border-2 border-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:text-white flex items-center justify-center gap-2"
            >
              {status === 'sending' ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit My Feedback'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
