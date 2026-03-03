'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export type AnimationPreset =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeIn'
  | 'scaleIn'
  | 'slideRight'
  | 'slideLeft'
  | 'staggerUp';

interface Options {
  preset?: AnimationPreset;
  delay?: number;
  duration?: number;
  staggerAmount?: number;
  /** Selector for child elements to stagger (used with staggerUp) */
  staggerSelector?: string;
}

const PRESETS: Record<AnimationPreset, gsap.TweenVars> = {
  fadeUp:     { y: 30, opacity: 0, ease: 'power3.out' },
  fadeDown:   { y: -30, opacity: 0, ease: 'power3.out' },
  fadeIn:     { opacity: 0, ease: 'power2.out' },
  scaleIn:    { scale: 0.92, opacity: 0, ease: 'back.out(1.7)' },
  slideRight: { x: -40, opacity: 0, ease: 'power3.out' },
  slideLeft:  { x: 40, opacity: 0, ease: 'power3.out' },
  staggerUp:  { y: 24, opacity: 0, ease: 'power3.out' },
};

/**
 * Animate an element on mount using GSAP.
 * Returns a ref to attach to the target element.
 */
export function useGsapEntrance<T extends HTMLElement = HTMLDivElement>(opts: Options = {}) {
  const ref = useRef<T>(null);
  const {
    preset = 'fadeUp',
    delay = 0,
    duration = 0.7,
    staggerAmount = 0.08,
    staggerSelector,
  } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (preset === 'staggerUp' && staggerSelector) {
      const children = el.querySelectorAll(staggerSelector);
      if (children.length) {
        gsap.from(children, {
          ...PRESETS.staggerUp,
          duration,
          delay,
          stagger: staggerAmount,
        });
        return;
      }
    }

    gsap.from(el, {
      ...PRESETS[preset],
      duration,
      delay,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

/**
 * Imperatively run a GSAP timeline on a ref.
 * Useful for open/close panel animations.
 */
export function animatePanel(el: HTMLElement, open: boolean, direction: 'right' | 'left' = 'right') {
  const xVal = direction === 'right' ? '100%' : '-100%';

  if (open) {
    gsap.fromTo(el,
      { x: xVal, opacity: 0.5 },
      { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  } else {
    gsap.to(el, {
      x: xVal,
      opacity: 0.5,
      duration: 0.35,
      ease: 'power3.in',
    });
  }
}

/**
 * Stagger-animate a grid of cards that just appeared.
 */
export function staggerCards(containerEl: HTMLElement, selector: string) {
  const children = containerEl.querySelectorAll(selector);
  if (!children.length) return;
  gsap.from(children, {
    y: 30,
    opacity: 0,
    scale: 0.96,
    duration: 0.5,
    stagger: 0.06,
    ease: 'power3.out',
  });
}
