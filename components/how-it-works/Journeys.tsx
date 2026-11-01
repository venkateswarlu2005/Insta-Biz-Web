'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PupBuddy } from '@/components/pup/PupBuddy';
import { PostcardPlane, Skyline, STEP_ICONS } from '@/components/how-it-works/StepIcons';

export type Journey = {
  key: string;
  label: string;
  hint: string;
  heading: string;
  body?: string;
  note?: string;
  steps: { title: string; text: string }[];
};

const TINTS = ['#fbe3b4', '#fde6de', '#e3f0fb', '#e6f2df'];

function Postcard({ kind }: { kind: string }) {
  if (kind === 'imported') {
    return (
      <div aria-hidden="true" className="tp-postcard tp-postcard--sky">
        <svg viewBox="0 0 320 150" className="tp-postcard__route" preserveAspectRatio="none">
          <path d="M28 128C90 20 230 20 292 118" />
        </svg>
        <PostcardPlane className="tp-postcard__plane" />
        <span className="font-scrawl tp-postcard__from">Europe · Korea</span>
        <span className="font-scrawl tp-postcard__to">Dubai</span>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="tp-postcard">
      <span className="tp-postcard__sun" />
      <Skyline className="tp-postcard__city" />
      <span className="font-scrawl tp-postcard__to tp-postcard__to--left">Downtown Dubai</span>
    </div>
  );
}

/** "Two ways home": a two-tab switch between the local and imported journeys. */
export function Journeys({ journeys }: { journeys: Journey[] }) {
  const [active, setActive] = useState(journeys[0]?.key ?? '');
  // Both panels are visible until hydration, so the steps are readable without JS.
  const [ready, setReady] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const at = Math.max(0, journeys.findIndex((j) => j.key === active));
  const n = journeys.length;
  const focusTab = (i: number) => {
    const k = (i + n) % n;
    setActive(journeys[k].key);
    tabs.current[k]?.focus();
  };

  return (
    <section className="tp-journeys" aria-labelledby="two-ways-title" data-ready={ready || undefined}>
      <div className="tp-journeys__top">
        <div>
          <p className="font-scrawl tp-journeys__kicker">choose your way</p>
          <h2 id="two-ways-title" className="font-plush text-big">
            Two ways home
          </h2>
        </div>
        <div className="tp-journeys__pick">
          <div role="tablist" aria-label="Ways to bring your puppy home" className="tp-switch" style={{ '--at': at, '--n': n } as CSSProperties}>
            <span aria-hidden="true" className="tp-switch__thumb" />
            {journeys.map((j, i) => (
              <button
                key={j.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${j.key}`}
                aria-selected={active === j.key}
                aria-controls={`panel-${j.key}`}
                tabIndex={active === j.key ? 0 : -1}
                onClick={() => setActive(j.key)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') focusTab(i + 1);
                  if (e.key === 'ArrowLeft') focusTab(i - 1);
                }}
                className="tp-switch__tab"
              >
                <span className="font-plush tp-switch__label">{j.label}</span>
                <span className="tp-switch__hint">{j.hint}</span>
              </button>
            ))}
          </div>
          <PupBuddy pose="sit" act="tilt" className="tp-journeys__teddy" label="Teddy, waiting to see which way you pick" />
        </div>
      </div>

      {journeys.map((j) => {
        const icons = STEP_ICONS[j.key as keyof typeof STEP_ICONS] ?? STEP_ICONS.local;
        return (
          <div
            key={j.key}
            role="tabpanel"
            id={`panel-${j.key}`}
            aria-labelledby={`tab-${j.key}`}
            hidden={ready && active !== j.key}
            className="tp-journey"
          >
            <div className="tp-journey__head">
              <div>
                <h3 className="font-plush tp-journey__title">{j.heading}</h3>
                {j.body && <p className="text-lede mt-4 text-[var(--ink-soft)]">{j.body}</p>}
                {j.note && <p className="font-scrawl mt-4 text-toffee-ink">{j.note}</p>}
              </div>
              <Postcard kind={j.key} />
            </div>
            <ol className="tp-steps">
              {j.steps.map((s, i) => (
                <li key={s.title} className="tp-step" style={{ '--i': i, '--tint': TINTS[i % TINTS.length] } as CSSProperties}>
                  <span aria-hidden="true" className="tp-step__icon">
                    {icons[i % 4]}
                  </span>
                  <span className="tp-step__num font-plush">Step {i + 1}</span>
                  <h4 className="font-plush-text tp-step__title">{s.title}</h4>
                  <p className="tp-step__text">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
