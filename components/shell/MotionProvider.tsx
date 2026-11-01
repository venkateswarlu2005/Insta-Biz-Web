'use client';

import { domMax, LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Motion features for `m.*` components; honours the OS "reduce motion" setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
