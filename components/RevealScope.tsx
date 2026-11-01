'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';
import { curtainDown } from '@/lib/curtain';
import { EVENTS, prefersReducedMotion } from '@/lib/motion';

/**
 * Marks [data-reveal] descendants with data-revealed="true" as they scroll into view;
 * CSS does the actual animation. Elements already on screen reveal immediately
 * (or right after the route curtain lifts).
 */
export function RevealScope({ children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pending = () => root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])');

    if (prefersReducedMotion()) {
      const showAll = () => pending().forEach((el) => (el.dataset.revealed = 'true'));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const waiting = new Set<HTMLElement>();
    const reveal = (el: HTMLElement) => {
      el.dataset.revealed = 'true';
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (curtainDown()) waiting.add(el);
          else reveal(el);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    const arm = (el: HTMLElement) => {
      if (el.dataset.armed) return io.observe(el);
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !curtainDown()) {
        el.dataset.revealed = 'true';
        return;
      }
      el.dataset.armed = 'true';
      io.observe(el);
    };
    pending().forEach(arm);
    const mo = new MutationObserver(() => pending().forEach(arm));
    mo.observe(root, { childList: true, subtree: true });

    const flush = () => {
      waiting.forEach(reveal);
      waiting.clear();
    };
    addEventListener(EVENTS.arrived, flush);
    // safety net in case the arrival event is missed
    let timer: ReturnType<typeof setTimeout>;
    const check = () => (curtainDown() ? (timer = setTimeout(check, 400)) : flush());
    timer = setTimeout(check, 1600);

    return () => {
      clearTimeout(timer);
      io.disconnect();
      mo.disconnect();
      removeEventListener(EVENTS.arrived, flush);
    };
  }, []);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
