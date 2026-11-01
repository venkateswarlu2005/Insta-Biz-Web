'use client';

import { useEffect, useRef } from 'react';
import { PawIcon } from '@/components/icons';
import { NavLink } from '@/components/shell/NavLink';
import { EVENTS, prefersReducedMotion } from '@/lib/motion';
import { NAV } from '@/lib/site';

const LINK = 'tp-menu-link font-plush block py-2 text-[clamp(2.4rem,11vw,3.4rem)]';

export function MobileMenu({ whatsappHref, phoneDisplay }: { whatsappHref: string; phoneDisplay: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  // play the closing animation before actually closing the dialog
  const close = () => {
    const d = ref.current;
    if (!d?.open || d.dataset.closing) return;
    if (prefersReducedMotion()) return d.close();
    d.dataset.closing = 'true';
    const done = () => {
      clearTimeout(timer);
      d.removeEventListener('animationend', onEnd);
      if (d.dataset.closing) d.close();
    };
    const onEnd = (e: AnimationEvent) => e.target === d && done();
    const timer = setTimeout(done, 600);
    d.addEventListener('animationend', onEnd);
  };

  useEffect(() => {
    const shut = () => ref.current?.close();
    addEventListener(EVENTS.navigate, shut);
    return () => removeEventListener(EVENTS.navigate, shut);
  }, []);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cocoa bg-milk px-4 text-[0.95rem] font-semibold lg:hidden"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <PawIcon className="size-4" />
        Menu
      </button>
      <dialog
        ref={ref}
        aria-label="Site menu"
        className="tp-menu m-0 h-dvh max-h-none w-screen max-w-none bg-honey p-0 text-cocoa backdrop:bg-cocoa/40"
        onClick={(e) => e.target === ref.current && close()}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={(e) => delete e.currentTarget.dataset.closing}
      >
        <div className="flex h-full flex-col gutter pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
          <div className="flex items-center justify-between">
            <span className="font-scrawl text-lg">where to, friend?</span>
            <button type="button" onClick={close} className="h-11 rounded-full bg-cocoa px-5 font-semibold text-milk">
              Close
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex-1">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} onNavigate={close} className={LINK} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3">
            <a href={whatsappHref} className="btn btn-whatsapp w-full" target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
            <p className="text-center text-sm font-medium">{phoneDisplay}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
