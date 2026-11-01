'use client';

import { Fragment, useId, useMemo, useState, type CSSProperties } from 'react';
import { PupBuddy } from '@/components/pup/PupBuddy';
import { RevealScope } from '@/components/RevealScope';

export type Faq = { id: string; question: string; answer: string };

const TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.7, -1.9, 1.4];
const PINS = ['var(--color-toffee)', 'var(--color-sky-deep)', '#d9a13c', '#c45a6a'];

/** Wraps matches of the search query in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>))}</>;
}

/** FAQ as pinned notes on a cork board: search, and click a note to unfold its answer. */
export function NoticeBoard({ faqs, askHref }: { faqs: Faq[]; askHref: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const inputId = useId();
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(q)) : faqs), [faqs, q]);

  return (
    <div className="tp-notes" data-open={openId || q ? '' : undefined}>
      <aside className="tp-notes__side" aria-label="Find a question">
        <label htmlFor={inputId} className="font-scrawl tp-notes__label">
          sniff out a question
        </label>
        <div className="tp-notes__search">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tp-notes__lens">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="delivery, Korea, vaccinated…"
            autoComplete="off"
          />
        </div>
        <p className="tp-notes__count" aria-live="polite">
          {query.trim() ? `${shown.length} ${shown.length === 1 ? 'note' : 'notes'} found` : `${faqs.length} notes on the board`}
        </p>
        <div className="tp-notes__teddy">
          <span aria-hidden="true" className="tp-notes__bubble font-plush">
            <span className="tp-notes__q">?</span>
            <span className="tp-notes__a">!</span>
          </span>
          <PupBuddy pose="sit" act="tilt" label="Teddy, reading the notes" />
        </div>
        <a href={askHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-notes__ask">
          Ask your own question
        </a>
      </aside>

      <RevealScope className="tp-notes__board">
        <ul className="tp-notes__list">
          {shown.map((f, i) => {
            const open = openId === f.id || (!!q && f.answer.toLowerCase().includes(q));
            return (
              <li
                key={f.id}
                className="tp-note"
                data-reveal="true"
                data-unfolded={open || undefined}
                style={{ '--tilt': `${TILTS[i % TILTS.length]}deg`, '--pin': PINS[i % PINS.length], '--i': i } as CSSProperties}
              >
                <span aria-hidden="true" className="tp-note__pin" />
                <h2 className="tp-note__q">
                  <button
                    type="button"
                    id={`q-${f.id}`}
                    aria-expanded={open}
                    aria-controls={`a-${f.id}`}
                    onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  >
                    <span className="font-plush-text">
                      <Highlight text={f.question} query={query} />
                    </span>
                    <span aria-hidden="true" className="tp-note__chevron" />
                  </button>
                </h2>
                <div id={`a-${f.id}`} role="region" aria-labelledby={`q-${f.id}`} className="tp-note__answer" inert={!open}>
                  <div className="tp-note__flap">
                    <p>
                      <Highlight text={f.answer} query={query} />
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!shown.length && (
          <div className="tp-note tp-note--empty">
            <span aria-hidden="true" className="tp-note__pin" />
            <p className="font-plush-text text-[1.2rem] font-bold">No note about “{query.trim()}” yet.</p>
            <p className="mt-2">
              <a href={askHref} target="_blank" rel="noopener noreferrer" className="link-ink">
                Ask us on WhatsApp
              </a>{' '}
              and we&apos;ll answer.
            </p>
          </div>
        )}
      </RevealScope>
    </div>
  );
}
