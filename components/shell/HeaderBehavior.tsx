'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

/** Fixed header that tucks away while scrolling down and returns when scrolling up. */
export function HeaderBehavior({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const isHome = usePathname() === '/';

  useEffect(() => {
    const el = ref.current!;
    let last = scrollY;
    let queued = false;
    const update = () => {
      const y = scrollY;
      el.dataset.scrolled = y > 8 ? 'true' : 'false';
      if (Math.abs(y - last) > 6) {
        el.dataset.hidden = y > last && y > 220 ? 'true' : 'false';
        last = y;
      }
      queued = false;
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    const show = () => (el.dataset.hidden = 'false');
    update();
    addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('focusin', show);
    return () => {
      removeEventListener('scroll', onScroll);
      el.removeEventListener('focusin', show);
    };
  }, []);

  return (
    <header
      ref={ref}
      id="site-header"
      data-scrolled="false"
      data-hidden="false"
      data-home={isHome || undefined}
      className="tp-header fixed inset-x-0 top-0 z-50"
    >
      {children}
    </header>
  );
}
