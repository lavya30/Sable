'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';

export type KeystrokeSoundTheme = 'off' | 'typewriter' | 'mechanical' | 'pen';

/**
 * Synthesizes keystroke sounds via the Web Audio API.
 * No external libraries or audio files needed.
 */
export function useKeystrokeSounds(
  editor: Editor | null,
  theme: KeystrokeSoundTheme,
  volume: number = 0.5
) {
  const ctxRef = useRef<AudioContext | null>(null);

  // Lazily create AudioContext (must happen after user gesture)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ─── Sound synthesis functions ────────────────────────────

  const playTypewriter = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Thunk: low-frequency oscillator
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80 + Math.random() * 40, now);
    osc.connect(gain);
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);

    // Click: short noise burst
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.3, now);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }, [getCtx, volume]);

  const playMechanical = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Sharp click: high-frequency square wave
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600 + Math.random() * 400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    // High-pass filter for crispness
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }, [getCtx, volume]);

  const playPen = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Soft scratch: filtered noise
    const bufferSize = ctx.sampleRate * 0.025;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 600, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }, [getCtx, volume]);

  const playSound = useCallback(() => {
    switch (theme) {
      case 'typewriter':
        playTypewriter();
        break;
      case 'mechanical':
        playMechanical();
        break;
      case 'pen':
        playPen();
        break;
    }
  }, [theme, playTypewriter, playMechanical, playPen]);

  // ─── Attach to editor keydown ─────────────────────────────

  useEffect(() => {
    if (!editor || theme === 'off') return;

    const view = editor.view;
    const dom = view.dom;

    function handleKeyDown(e: Event) {
      const key = (e as KeyboardEvent).key;
      // Only play for printable characters, Enter, Backspace, Space, Tab
      if (
        key.length === 1 ||
        key === 'Enter' ||
        key === 'Backspace' ||
        key === 'Delete' ||
        key === 'Tab'
      ) {
        playSound();
      }
    }

    dom.addEventListener('keydown', handleKeyDown);
    return () => dom.removeEventListener('keydown', handleKeyDown);
  }, [editor, theme, playSound]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);
}
