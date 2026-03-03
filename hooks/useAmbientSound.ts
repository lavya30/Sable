'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type AmbientSoundType = 'off' | 'rain' | 'lofi' | 'cafe' | 'fireplace' | 'whitenoise';

export const AMBIENT_SOUNDS: { value: AmbientSoundType; icon: string; label: string }[] = [
  { value: 'off',        icon: 'volume_off',    label: 'Off' },
  { value: 'rain',       icon: 'water_drop',    label: 'Rain' },
  { value: 'lofi',       icon: 'headphones',    label: 'Lo-fi' },
  { value: 'cafe',       icon: 'local_cafe',    label: 'Café' },
  { value: 'fireplace',  icon: 'local_fire_department', label: 'Fire' },
  { value: 'whitenoise', icon: 'waves',         label: 'Noise' },
];

/**
 * Synthesises ambient background soundscapes entirely via the Web Audio API.
 * No audio files needed — everything is procedurally generated.
 */
export function useAmbientSound(soundType: AmbientSoundType, volume: number = 0.5) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Cleanup helper
  const stopAll = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    nodesRef.current.forEach((n) => {
      try {
        if ('stop' in n && typeof (n as AudioBufferSourceNode).stop === 'function') {
          (n as AudioBufferSourceNode).stop();
        }
        n.disconnect();
      } catch { /* already stopped */ }
    });
    nodesRef.current = [];
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // ─── Sound generators ─────────────────────────────────────

  const createBrownNoise = useCallback((ctx: AudioContext, gain: GainNode, vol: number) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const sourceGain = ctx.createGain();
    sourceGain.gain.value = vol;
    source.connect(sourceGain).connect(gain);
    source.start();
    nodesRef.current.push(source, sourceGain);
    return source;
  }, []);

  const startRain = useCallback((ctx: AudioContext, gain: GainNode) => {
    // Base: filtered brown noise for steady rain texture
    const noiseLen = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(2, noiseLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = noiseBuffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < noiseLen; i++) {
        last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 4;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    lp.Q.value = 0.5;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 200;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.6;
    noise.connect(lp).connect(hp).connect(noiseGain).connect(gain);
    noise.start();
    nodesRef.current.push(noise, lp, hp, noiseGain);

    // Occasional drip/drop sounds
    const dripInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const freq = 2000 + Math.random() * 4000;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.06);

      const dripGain = ctx.createGain();
      dripGain.gain.setValueAtTime(0.03 + Math.random() * 0.04, now);
      dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      // Pan randomly for spatial feel
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 2 - 1;

      osc.connect(dripGain).connect(pan).connect(gain);
      osc.start(now);
      osc.stop(now + 0.08);
      // Nodes auto-disconnect after stop
    }, 200 + Math.random() * 400);
    intervalsRef.current.push(dripInterval);

    // Slow LFO modulating the filter to create wave-like surges
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    nodesRef.current.push(lfo, lfoGain);
  }, []);

  const startLofi = useCallback((ctx: AudioContext, gain: GainNode) => {
    // Lo-fi beat: kick + hi-hat pattern + warm pad chord

    // 1) Warm pad (filtered sawtooth chord)
    const chordFreqs = [130.81, 164.81, 196.00, 246.94]; // C3, E3, G3, B3
    chordFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq + (Math.random() - 0.5) * 2; // slight detune

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lp.Q.value = 1;

      // Slow filter sweep
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + Math.random() * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 150;
      lfo.connect(lfoGain).connect(lp.frequency);
      lfo.start();

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.05;

      osc.connect(lp).connect(oscGain).connect(gain);
      osc.start();
      nodesRef.current.push(osc, lp, lfo, lfoGain, oscGain);
    });

    // 2) Gentle vinyl crackle (very quiet noise bursts)
    const crackleLen = ctx.sampleRate * 3;
    const crackleBuffer = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleLen; i++) {
      crackleData[i] = Math.random() < 0.001 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.01;
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuffer;
    crackle.loop = true;

    const crackleHp = ctx.createBiquadFilter();
    crackleHp.type = 'highpass';
    crackleHp.frequency.value = 1000;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.15;
    crackle.connect(crackleHp).connect(crackleGain).connect(gain);
    crackle.start();
    nodesRef.current.push(crackle, crackleHp, crackleGain);

    // 3) Lo-fi drum pattern
    const tempo = 75; // BPM
    const beatMs = (60 / tempo) * 1000;
    let beat = 0;

    const drumInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const step = beat % 8;

      // Kick on 0, 4
      if (step === 0 || step === 4) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        const kickGain = ctx.createGain();
        kickGain.gain.setValueAtTime(0.2, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(kickGain).connect(gain);
        osc.start(now);
        osc.stop(now + 0.3);
      }

      // Hi-hat on even beats + ghost on some odd
      if (step % 2 === 0 || (step % 2 === 1 && Math.random() > 0.5)) {
        const hatLen = ctx.sampleRate * 0.04;
        const hatBuf = ctx.createBuffer(1, hatLen, ctx.sampleRate);
        const hatData = hatBuf.getChannelData(0);
        for (let i = 0; i < hatLen; i++) {
          hatData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hatLen, 4);
        }
        const hat = ctx.createBufferSource();
        hat.buffer = hatBuf;
        const hatHp = ctx.createBiquadFilter();
        hatHp.type = 'highpass';
        hatHp.frequency.value = 6000;
        const hatGain = ctx.createGain();
        hatGain.gain.value = step % 2 === 0 ? 0.08 : 0.03; // Ghost hits quieter
        hat.connect(hatHp).connect(hatGain).connect(gain);
        hat.start(now);
      }

      // Snare on 2, 6 (subtle)
      if (step === 2 || step === 6) {
        const snareLen = ctx.sampleRate * 0.1;
        const snareBuf = ctx.createBuffer(1, snareLen, ctx.sampleRate);
        const snareData = snareBuf.getChannelData(0);
        for (let i = 0; i < snareLen; i++) {
          snareData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snareLen, 2);
        }
        const snare = ctx.createBufferSource();
        snare.buffer = snareBuf;
        const snareLp = ctx.createBiquadFilter();
        snareLp.type = 'bandpass';
        snareLp.frequency.value = 1200;
        snareLp.Q.value = 0.5;
        const snareGain = ctx.createGain();
        snareGain.gain.value = 0.06;
        snare.connect(snareLp).connect(snareGain).connect(gain);
        snare.start(now);
      }

      beat++;
    }, beatMs / 2);
    intervalsRef.current.push(drumInterval);
  }, []);

  const startCafe = useCallback((ctx: AudioContext, gain: GainNode) => {
    // Background murmur (filtered noise)
    createBrownNoise(ctx, gain, 0.25);

    // Occasional clinks and murmurs
    const clinkInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime;

      if (Math.random() > 0.6) {
        // Glass/ceramic clink: short high sine
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const freq = 3000 + Math.random() * 3000;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.05);

        const clinkGain = ctx.createGain();
        clinkGain.gain.setValueAtTime(0.02 + Math.random() * 0.03, now);
        clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 2 - 1;

        osc.connect(clinkGain).connect(pan).connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
      }

      if (Math.random() > 0.8) {
        // Brief muffled "voice" — bandpass-filtered noise burst
        const voiceLen = ctx.sampleRate * (0.2 + Math.random() * 0.3);
        const voiceBuf = ctx.createBuffer(1, voiceLen, ctx.sampleRate);
        const vd = voiceBuf.getChannelData(0);
        for (let i = 0; i < voiceLen; i++) {
          vd[i] = (Math.random() * 2 - 1) * Math.sin((i / voiceLen) * Math.PI);
        }
        const voice = ctx.createBufferSource();
        voice.buffer = voiceBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 300 + Math.random() * 400;
        bp.Q.value = 2;
        const vGain = ctx.createGain();
        vGain.gain.value = 0.04;
        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 2 - 1;
        voice.connect(bp).connect(vGain).connect(pan).connect(gain);
        voice.start(now);
      }
    }, 800 + Math.random() * 1200);
    intervalsRef.current.push(clinkInterval);
  }, [createBrownNoise]);

  const startFireplace = useCallback((ctx: AudioContext, gain: GainNode) => {
    // Base: warm brown noise with low-pass
    const noiseLen = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(2, noiseLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = noiseBuf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < noiseLen; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.45;

    // Slow modulation for breathing fire effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain).connect(noiseGain.gain);
    lfo.start();

    noise.connect(lp).connect(noiseGain).connect(gain);
    noise.start();
    nodesRef.current.push(noise, lp, noiseGain, lfo, lfoGain);

    // Crackle pops
    const popInterval = setInterval(() => {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime;

      if (Math.random() > 0.4) {
        const popLen = ctx.sampleRate * 0.02;
        const popBuf = ctx.createBuffer(1, popLen, ctx.sampleRate);
        const pd = popBuf.getChannelData(0);
        for (let i = 0; i < popLen; i++) {
          pd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / popLen, 6);
        }
        const pop = ctx.createBufferSource();
        pop.buffer = popBuf;
        const popGain = ctx.createGain();
        popGain.gain.value = 0.05 + Math.random() * 0.08;
        const pan = ctx.createStereoPanner();
        pan.pan.value = (Math.random() - 0.5) * 0.6;
        pop.connect(popGain).connect(pan).connect(gain);
        pop.start(now);
      }
    }, 150 + Math.random() * 300);
    intervalsRef.current.push(popInterval);
  }, []);

  const startWhiteNoise = useCallback((ctx: AudioContext, gain: GainNode) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Gentle low-pass to avoid harshness
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;

    source.connect(lp).connect(noiseGain).connect(gain);
    source.start();
    nodesRef.current.push(source, lp, noiseGain);
  }, []);

  // ─── Main effect: start/stop based on soundType ──────────

  useEffect(() => {
    if (soundType === 'off') {
      stopAll();
      return;
    }

    // Ensure previous sound is stopped first
    stopAll();

    const ctx = getCtx();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    switch (soundType) {
      case 'rain':       startRain(ctx, master); break;
      case 'lofi':       startLofi(ctx, master); break;
      case 'cafe':       startCafe(ctx, master); break;
      case 'fireplace':  startFireplace(ctx, master); break;
      case 'whitenoise': startWhiteNoise(ctx, master); break;
    }

    setIsPlaying(true);

    return () => { stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundType]);

  // ─── Volume control (live update) ────────────────────────

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, ctxRef.current?.currentTime ?? 0, 0.1);
    }
  }, [volume]);

  return { isPlaying, stopAll };
}
