'use client';

import { useEffect, useRef, useState } from 'react';

export type AmbientSoundType = 'off' | 'rain' | 'lofi' | 'cafe' | 'fireplace' | 'whitenoise';

export const AMBIENT_SOUNDS: { value: AmbientSoundType; icon: string; label: string }[] = [
  { value: 'off',        icon: 'volume_off',    label: 'Off' },
  { value: 'rain',       icon: 'water_drop',    label: 'Rain' },
  { value: 'lofi',       icon: 'headphones',    label: 'Lo-fi' },
  { value: 'cafe',       icon: 'local_cafe',    label: 'Café' },
  { value: 'fireplace',  icon: 'local_fire_department', label: 'Fire' },
  { value: 'whitenoise', icon: 'waves',         label: 'Noise' },
];

/** Map each sound type to its MP3 file in public/sounds/ */
const SOUND_FILES: Record<Exclude<AmbientSoundType, 'off'>, string> = {
  rain:       '/sounds/rain.mp3',
  lofi:       '/sounds/lofi.mp3',
  cafe:       '/sounds/cafe.mp3',
  fireplace:  '/sounds/fireplace.mp3',
  whitenoise: '/sounds/whitenoise.mp3',
};

/**
 * Plays ambient background audio from MP3 files in public/sounds/.
 * Audio loops seamlessly and volume can be adjusted live.
 */
export function useAmbientSound(soundType: AmbientSoundType, volume: number = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Start / stop / switch sound
  useEffect(() => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    }

    if (soundType === 'off') return;

    const src = SOUND_FILES[soundType];
    if (!src) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Try to play (may be blocked by autoplay policy until user gesture)
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked — wait for next user interaction to resume
          const resume = () => {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
            document.removeEventListener('click', resume);
            document.removeEventListener('keydown', resume);
          };
          document.addEventListener('click', resume, { once: true });
          document.addEventListener('keydown', resume, { once: true });
        });
    }

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundType]);

  // Live volume adjustment
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  return { isPlaying };
}
