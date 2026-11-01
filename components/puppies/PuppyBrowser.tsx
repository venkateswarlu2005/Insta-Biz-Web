'use client';

import { AnimatePresence, m } from 'motion/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, type ReactNode } from 'react';
import { RevealScope } from '@/components/RevealScope';
import { PupBuddy } from '@/components/pup/PupBuddy';
import type { PupCard } from '@/components/puppies/card';
import { PuppySketch, SKETCH_SIZES } from '@/components/puppies/PuppySketch';

type Query = { origin: string; breed: string; gender: string; collection: string };
type Key = keyof Query;
const KEYS: Key[] = ['origin', 'breed', 'gender', 'collection'];
const EMPTY: Query = { origin: '', breed: '', gender: '', collection: '' };

// accept the original site's spellings too (?gender=male, ?origin=dubai)
const ALIASES: Record<string, string> = { male: 'boy', female: 'girl', dubai: 'local' };
const norm = (v: string | null) => (v ? (ALIASES[v] ?? v) : '');

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="tp-sticker-chip">
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">{label}</span>
      {children}
    </div>
  );
}

type Props = { puppies: PupCard[]; whatsappHref: string };

type ViewProps = Props & {
  q: Query;
  /** toggle one filter (clicking the active chip again turns it off) */
  toggle: (key: Key, value: string) => void;
  clear: (...keys: Key[]) => void;
  /** false for the static HTML: plain list, no layout animation */
  live?: boolean;
};

function BrowserView({ puppies, whatsappHref, q, toggle, clear, live = true }: ViewProps) {
  const shown = useMemo(
    () =>
      puppies.filter(
        (p) =>
          (!q.origin || (q.origin === 'local' ? p.origin === 'dubai' : p.origin === q.origin)) &&
          (!q.breed || p.breeds.some((b) => b.slug === q.breed)) &&
          (!q.gender || p.gender === q.gender || p.gender === 'boy-girl') &&
          (!q.collection || (q.collection === 'korean-teacup' && p.koreanTeacup)),
      ),
    [puppies, q.origin, q.breed, q.gender, q.collection],
  );

  // breeds on offer right now, most common first (ties keep listing order)
  const breeds = useMemo(() => {
    const seen = new Map<string, { slug: string; name: string; n: number; first: number }>();
    puppies.forEach((p, i) =>
      p.breeds.forEach((b) => {
        const e = seen.get(b.slug);
        if (e) e.n++;
        else seen.set(b.slug, { ...b, n: 1, first: i });
      }),
    );
    return [...seen.values()].sort((a, b) => b.n - a.n || a.first - b.first);
  }, [puppies]);

  const filtered = KEYS.some((k) => q[k]);
  const hasLocal = puppies.some((p) => p.origin === 'dubai');
  const hasImported = puppies.some((p) => p.origin === 'imported');
  const hasTeacup = puppies.some((p) => p.koreanTeacup);

  return (
    <div>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <Row label="where">
          <Chip active={!q.origin && !q.collection} onClick={() => clear('origin', 'collection')}>
            Everywhere
          </Chip>
          {(hasLocal || q.origin === 'local') && (
            <Chip active={q.origin === 'local'} onClick={() => toggle('origin', 'local')}>
              In Dubai
            </Chip>
          )}
          {hasImported && (
            <Chip active={q.origin === 'imported'} onClick={() => toggle('origin', 'imported')}>
              Imported
            </Chip>
          )}
          {hasTeacup && (
            <Chip active={q.collection === 'korean-teacup'} onClick={() => toggle('collection', 'korean-teacup')}>
              Korean Teacup
            </Chip>
          )}
        </Row>
        <Row label="breed">
          <Chip active={!q.breed} onClick={() => clear('breed')}>
            All
          </Chip>
          {breeds.map((b) => (
            <Chip key={b.slug} active={q.breed === b.slug} onClick={() => toggle('breed', b.slug)}>
              {b.name}
            </Chip>
          ))}
        </Row>
        <Row label="boy or girl">
          <Chip active={!q.gender} onClick={() => clear('gender')}>
            All
          </Chip>
          <Chip active={q.gender === 'boy'} onClick={() => toggle('gender', 'boy')}>
            Boys
          </Chip>
          <Chip active={q.gender === 'girl'} onClick={() => toggle('gender', 'girl')}>
            Girls
          </Chip>
          {filtered && (
            <button type="button" onClick={() => clear(...KEYS)} className="link-ink ml-auto text-[0.95rem] font-semibold">
              Clear filters
            </button>
          )}
        </Row>
      </div>

      <p className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {shown.length === 1 ? '1 puppy' : `${shown.length} puppies`} {filtered ? 'match' : 'looking for a home'}
      </p>

      {shown.length && !live ? (
        <RevealScope>
          <ul className="tp-sketches mt-8">
            {shown.map((p, i) => (
              <li key={p.slug}>
                <PuppySketch pup={p} index={i} sizes={SKETCH_SIZES} />
              </li>
            ))}
          </ul>
        </RevealScope>
      ) : shown.length ? (
        <RevealScope>
          <m.ul layout className="tp-sketches mt-8">
            {/* cards already on the page don't fade in again when the live list takes over */}
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((p, i) => (
                <m.li
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                >
                  <PuppySketch pup={p} index={i} sizes={SKETCH_SIZES} />
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        </RevealScope>
      ) : (
        <div className="tp-sketchpad mt-10 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <PupBuddy pose="sit" act="tilt" className="mx-auto w-44 md:w-52" label="Teddy, tilting his head" />
          <div>
            <p className="font-plush text-big">No puppies match just now.</p>
            <p className="mt-3 max-w-[48ch] text-cocoa-soft">
              Tell us what you&apos;re hoping for and we&apos;ll let you know what&apos;s in our showroom or what we can bring in for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Ask on WhatsApp
              </a>
              <button type="button" onClick={() => clear(...KEYS)} className="btn btn-ghost">
                Show all puppies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reads and writes the filters in the URL (?origin=&breed=&gender=&collection=). */
function LiveBrowser(props: Props) {
  const params = useSearchParams();
  const pathname = usePathname();
  const q: Query = {
    origin: norm(params.get('origin')),
    breed: norm(params.get('breed')),
    gender: norm(params.get('gender')),
    collection: norm(params.get('collection')),
  };

  const write = (next: URLSearchParams) => {
    const s = next.toString();
    // Next keeps useSearchParams in sync with history.replaceState, without a navigation
    window.history.replaceState(null, '', s ? `${pathname}?${s}` : pathname);
  };
  const toggle = (key: Key, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (q[key] === value) next.delete(key);
    else next.set(key, value);
    write(next);
  };
  const clear = (...keys: Key[]) => {
    const next = new URLSearchParams(params.toString());
    keys.forEach((k) => next.delete(k));
    write(next);
  };

  return <BrowserView {...props} q={q} toggle={toggle} clear={clear} />;
}

const noop = () => {};

/**
 * Filter sketchpad + puppy grid. The static HTML shows every puppy (no query on the server);
 * the query string is read on the client.
 */
export function PuppyBrowser(props: Props) {
  return (
    <Suspense fallback={<BrowserView {...props} q={EMPTY} toggle={noop} clear={noop} live={false} />}>
      <LiveBrowser {...props} />
    </Suspense>
  );
}
