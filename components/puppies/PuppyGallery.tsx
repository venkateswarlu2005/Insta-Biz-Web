'use client';

import { AnimatePresence, m } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Img } from '@/components/Img';
import type { MediaItem } from '@/lib/puppy';

/** the stage is 7/12 of the page on desktop, nearly full width on phones */
const STAGE_SIZES = '(min-width: 1024px) 55vw, 92vw';

/** what to show for a media item as a still: the photo, or the video's poster */
/** the viewer only renders after a click, so the window size is known: ask for exactly that width */
const viewerSizes = () => `${Math.ceil(window.innerWidth)}px`;

const still = (item: MediaItem) => (item.type === 'video' ? { ...item, src: item.poster || '' } : item);

function ViewerImage({ media }: { media: MediaItem }) {
  const [sharp, setSharp] = useState(false);
  return (
    <>
      {/* the stage-sized copy is already cached: show it at once, then swap in the sharp one */}
      <Img
        media={media}
        alt=""
        sizes={STAGE_SIZES}
        loading="eager"
        className={sharp ? 'tp-viewer__first tp-viewer__first--done' : 'tp-viewer__first'}
        style={{ objectFit: 'contain', objectPosition: '50% 50%', backgroundColor: 'transparent' }}
      />
      <Img
        media={media}
        sizes={viewerSizes()}
        loading="eager"
        className="tp-viewer__sharp"
        data-sharp={sharp || undefined}
        style={{ objectFit: 'contain', objectPosition: '50% 50%', backgroundColor: 'transparent' }}
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

/** Photos and videos of one puppy: a page-turning stage, thumbnails and a full-screen viewer. */
export function PuppyGallery({ name, media }: { name: string; media: MediaItem[] }) {
  const [at, setAt] = useState(0);
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState(false);
  // videos only start playing once someone has asked to see them
  const [touched, setTouched] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const count = media.length;
  const item = media[at];

  const go = useCallback(
    (i: number) => {
      setDir(i > at ? 1 : -1);
      setAt(((i % count) + count) % count);
      setTouched(true);
    },
    [at, count],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(at + 1);
      if (e.key === 'ArrowLeft') go(at - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, at, go]);

  if (!item) return null;
  const label = (i: number) => `${name}, ${media[i].type === 'video' ? 'video' : 'photo'} ${i + 1} of ${count}`;

  return (
    <div>
      <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <m.button
            key={at}
            type="button"
            custom={dir}
            className="absolute inset-0 block size-full"
            initial={{
              clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
              rotateY: -14 * dir,
              transformPerspective: 1400,
            }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', rotateY: 0 }}
            exit={{ opacity: 0.4, scale: 0.97 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: dir > 0 ? '0% 50%' : '100% 50%' }}
            onClick={() => {
              setTouched(true);
              setOpen(true);
              dialog.current?.showModal();
            }}
            aria-label={`Open ${label(at)} full screen`}
          >
            {item.type === 'video' ? (
              <>
                <video
                  src={item.src}
                  poster={item.poster}
                  className="size-full object-cover"
                  style={{ objectPosition: item.focus, backgroundColor: item.color }}
                  muted
                  loop
                  playsInline
                  autoPlay={touched}
                  preload={touched ? 'metadata' : 'none'}
                  aria-label={item.alt}
                />
                {!touched && (
                  <span aria-hidden="true" className="tp-play absolute inset-0 grid place-items-center">
                    <span className="grid size-16 place-items-center rounded-full border-[3px] border-cocoa bg-milk/95 pl-1 text-2xl">▶</span>
                  </span>
                )}
              </>
            ) : (
              <Img media={item} sizes={STAGE_SIZES} priority={at === 0 && !touched} />
            )}
          </m.button>
        </AnimatePresence>
        {count > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button
              type="button"
              onClick={() => go(at - 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">
              {at + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(at + 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]" aria-label={`All photos of ${name}`}>
          {media.map((x, i) => (
            <li key={`${x.src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={label(i)}
                aria-current={i === at}
                className={`relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 ${
                  i === at ? '-rotate-3 -translate-y-1 border-toffee-deep' : 'border-cocoa/30 hover:-rotate-2 hover:border-cocoa'
                }`}
              >
                {(x.type === 'image' || x.poster) && <Img media={still(x)} alt="" sizes="96px" />}
                {x.type === 'video' && (
                  <span className="absolute inset-0 grid place-items-center bg-cocoa/30 text-lg text-milk">▶</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={`${name} photos`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        data-lenis-prevent
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-scrawl text-lg">{label(at)}</p>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 touch-pan-y">
              <m.div
                key={at}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(at + 1);
                  else if (info.offset.x > 80) go(at - 1);
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {item.type === 'video' ? (
                  <video src={item.src} poster={item.poster} controls autoPlay playsInline className="size-full object-contain" />
                ) : (
                  <ViewerImage media={item} />
                )}
              </m.div>
              <Neighbours media={media} at={at} />
            </div>
            {count > 1 && (
              <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={() => go(at - 1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
                  Previous
                </button>
                <button type="button" onClick={() => go(at + 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

/** While the viewer is open, warm up the photos either side so swiping feels instant. */
function Neighbours({ media, at }: { media: MediaItem[]; at: number }) {
  const n = media.length;
  if (n < 2) return null;
  const around = [...new Set([(at - 1 + n) % n, (at + 1) % n])].filter((i) => media[i].type === 'image');
  return (
    <span aria-hidden="true" className="sr-only">
      {around.map((i) => (
        <Img key={i} media={media[i]} alt="" sizes={viewerSizes()} loading="eager" />
      ))}
    </span>
  );
}
