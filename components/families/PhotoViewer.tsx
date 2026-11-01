'use client';

import Image from 'next/image';
import { AnimatePresence, m, type Variants } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PolaroidMedia } from '@/components/families/Polaroid';

/** Width the photo will actually be shown at inside the viewer (fits the screen minus the toolbars). */
const viewerWidth = (p: PolaroidMedia) =>
  Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * ((p.width ?? 1) / (p.height ?? 1))));

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 70 * dir, rotate: 5 * dir, scale: 0.92 }),
  center: { opacity: 1, x: 0, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  exit: (dir: number) => ({ opacity: 0, x: -70 * dir, rotate: -5 * dir, scale: 0.92, transition: { duration: 0.22 } }),
};

/** Shows the already-loaded wall-sized copy at once, then swaps in the sharp screen-sized one. */
function ViewerPhoto({ photo, pageSizes }: { photo: PolaroidMedia; pageSizes: string }) {
  const [sharp, setSharp] = useState(false);
  return (
    <>
      <Image
        src={photo.src}
        alt=""
        fill
        sizes={pageSizes}
        loading="eager"
        className={sharp ? 'tp-viewer__first tp-viewer__first--done' : 'tp-viewer__first'}
        style={{ objectFit: 'contain', objectPosition: '50% 50%', backgroundColor: 'transparent' }}
      />
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={`${viewerWidth(photo)}px`}
        loading="eager"
        className="tp-viewer__sharp object-contain"
        data-sharp={sharp || undefined}
        onLoad={(e) => {
          e.currentTarget
            .decode()
            .catch(() => {})
            .then(() => setSharp(true));
        }}
      />
    </>
  );
}

/** Preloads the neighbours so Previous / Next feel instant. */
function Neighbours({ photos, at }: { photos: PolaroidMedia[]; at: number }) {
  const n = photos.length;
  if (n < 2) return null;
  const idx = [...new Set([(at - 1 + n) % n, (at + 1) % n])];
  return (
    <span aria-hidden="true" className="sr-only">
      {idx.map((i) => (
        <Image key={photos[i].src} src={photos[i].src} alt="" fill sizes={`${viewerWidth(photos[i])}px`} loading="eager" />
      ))}
    </span>
  );
}

/** Full-screen photo viewer in a <dialog>: arrows, swipe, Previous / Next. */
export function usePhotoViewer(photos: PolaroidMedia[], pageSizes: string) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const n = photos.length;
  const wrap = useCallback((i: number) => ((i % n) + n) % n, [n]);
  const go = useCallback(
    (i: number, d: number) => {
      setDir(d);
      setAt(wrap(i));
    },
    [wrap],
  );

  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(at + 1, 1);
      if (e.key === 'ArrowLeft') go(at - 1, -1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [at, go]);

  const photo = at === null ? null : photos[at];

  const open = (i: number) => {
    setDir(1);
    setAt(i);
    dialog.current?.showModal();
  };

  const viewer = (
    <dialog
      ref={dialog}
      aria-label="Photo viewer"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => setAt(null)}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      data-lenis-prevent=""
    >
      {photo && at !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">
              {at + 1} / {n}
              {photo.caption ? ` — ${photo.caption}` : ''}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">
              Close
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} custom={dir}>
              <m.div
                key={photo.src}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(at + 1, 1);
                  else if (info.offset.x > 80) go(at - 1, -1);
                }}
              >
                <ViewerPhoto photo={photo} pageSizes={pageSizes} />
              </m.div>
            </AnimatePresence>
            <Neighbours photos={photos} at={at} />
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => go(at - 1, -1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
              Previous
            </button>
            <button type="button" onClick={() => go(at + 1, 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
              Next
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return { open, viewer };
}
