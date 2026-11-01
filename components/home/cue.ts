'use client';

import { useSyncExternalStore } from 'react';

export { cuePup, type PupCue } from '@/lib/pup/journey';

/** true while the media query matches (false during the static render). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
