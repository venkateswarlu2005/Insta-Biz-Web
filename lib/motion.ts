'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/** true when the visitor asked the OS for less motion */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/** Cross-component signals (window CustomEvents) used by the route curtain and scenes. */
export const EVENTS = {
  /** a client-side navigation started */
  navigate: 'tp:navigate',
  /** the new page is in place and the curtain has lifted */
  arrived: 'tp:arrived',
} as const;
