'use client';

import Lenis from 'lenis';
import { cancelFrame, frame } from 'motion/react';
import { useEffect } from 'react';
import { EVENTS, prefersReducedMotion, useReducedMotion } from '@/lib/motion';

let lenis: Lenis | null = null;

/** The active smooth scroller (desktop only), for components that need to scroll programmatically. */
export const getLenis = () => lenis;

/** Gentle wheel smoothing on desktop, plus smooth in-page #anchor jumps everywhere. */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href*='#']");
      if (!a || (a.target && a.target !== '_self')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || url.hash.length < 2) return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = [...document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)].find((el) => el.getClientRects().length);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target);
      else target.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
      history.pushState(null, '', url.hash);
    };
    addEventListener('click', onClick);
    return () => removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = document.documentElement;
    const l = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      wheelMultiplier: 0.85,
      prevent: (node) => !!node.closest?.('dialog, [data-lenis-prevent]'),
      virtualScroll: () => getComputedStyle(root).overflowY !== 'hidden',
    });
    lenis = l;
    const resync = () => l.scrollTo(l.actualScroll, { immediate: true });
    addEventListener(EVENTS.navigate, resync);
    addEventListener('popstate', resync);
    const tick = ({ timestamp }: { timestamp: number }) => l.raf(timestamp);
    frame.read(tick, true);
    return () => {
      cancelFrame(tick);
      removeEventListener(EVENTS.navigate, resync);
      removeEventListener('popstate', resync);
      l.destroy();
      lenis = null;
    };
  }, [reduced]);

  return null;
}
