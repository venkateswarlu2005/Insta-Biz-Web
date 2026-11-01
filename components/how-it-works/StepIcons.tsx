import type { ReactElement } from 'react';

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** One hand-drawn icon per step, for each way home (the original's icon sets). */
export const STEP_ICONS: Record<'local' | 'imported', ReactElement[]> = {
  local: [
    <svg key="find" viewBox="0 0 48 48">
      <circle cx="21" cy="21" r="12" {...line} />
      <path d="m30 30 10 10" {...line} />
      <path d="M21 27c-3-2-4.4-3.6-4.4-5.2a2.2 2.2 0 0 1 4.4-.4 2.2 2.2 0 0 1 4.4.4c0 1.6-1.4 3.2-4.4 5.2z" fill="currentColor" />
    </svg>,
    <svg key="choose" viewBox="0 0 48 48">
      <path
        d="M24 40C11 31 6 24.5 6 17.8 6 12.4 10.2 8 15.4 8c3.7 0 6.8 2.1 8.6 5.3C25.8 10.1 28.9 8 32.6 8 37.8 8 42 12.4 42 17.8 42 24.5 37 31 24 40z"
        {...line}
      />
      <path d="m17 22 5 5 9-10" {...line} />
    </svg>,
    <svg key="meet" viewBox="0 0 48 48">
      <path d="M14 18c-3-6-1-10 3-10s5 4 4 8M34 18c3-6 1-10-3-10s-5 4-4 8" {...line} />
      <ellipse cx="24" cy="27" rx="13" ry="12" {...line} />
      <circle cx="19.5" cy="25" r="1.6" fill="currentColor" />
      <circle cx="28.5" cy="25" r="1.6" fill="currentColor" />
      <path d="M22 31h4l-2 2z" {...line} fill="currentColor" strokeWidth={1.6} />
    </svg>,
    <svg key="home" viewBox="0 0 48 48">
      <path d="M5 30V18h22v12M27 22h8l6 6v2H27" {...line} />
      <path d="M5 30h36" {...line} />
      <circle cx="13" cy="33" r="3.4" {...line} />
      <circle cx="34" cy="33" r="3.4" {...line} />
      <path d="M16 26c-2.3-1.6-3.4-2.8-3.4-4a1.7 1.7 0 0 1 3.4-.4 1.7 1.7 0 0 1 3.4.4c0 1.2-1.1 2.4-3.4 4z" fill="currentColor" />
    </svg>,
  ],
  imported: [
    <svg key="reserve" viewBox="0 0 48 48">
      <rect x="7" y="10" width="34" height="30" rx="5" {...line} />
      <path d="M7 19h34M16 6v8M32 6v8" {...line} />
      <path d="m17 29 5 5 9-9" {...line} />
    </svg>,
    <svg key="consult" viewBox="0 0 48 48">
      <path d="M6 12a5 5 0 0 1 5-5h16a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-9l-6 5v-5h-1a5 5 0 0 1-5-5z" {...line} />
      <path d="M36 17h1a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-1v5l-6-5h-6a5 5 0 0 1-4-2" {...line} />
    </svg>,
    <svg key="fly" viewBox="0 0 48 48">
      <path
        transform="matrix(-1 0 0 1 48 0)"
        d="M4 27l13-1.5 8-10h4l-4 9.5 9-.8 4-4.7h3l-2 6.6 2 6.6h-3l-4-4.7-9-.8 4 9.5h-4l-8-10L4 29z"
        {...line}
      />
    </svg>,
    <svg key="welcome" viewBox="0 0 48 48">
      <path d="M6 23 24 8l18 15M11 19v21h26V19" {...line} />
      <path d="M24 35c-4.6-3.2-6.8-5.7-6.8-8.2a3.4 3.4 0 0 1 6.8-.8 3.4 3.4 0 0 1 6.8.8c0 2.5-2.2 5-6.8 8.2z" fill="currentColor" />
    </svg>,
  ],
};

const outline = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Small paper plane used on the "Imported" postcard. */
export function PostcardPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path d="M4 22l20-2 12-14h6l-6 14 14-1 6-7h4l-3 10 3 10h-4l-6-7-14-1 6 14h-6L24 24 4 22z" {...outline} fill="#fffdf8" strokeWidth={2.6} />
    </svg>
  );
}

/** Line-drawn Dubai skyline. */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} aria-hidden="true">
      <path
        d="M4 116h292M20 116V78h16v38M44 116V60h18v56M70 116V84h12v32M150 116V36l4-6v-14l3-4 3 4v14l4 6v80M118 116V70l12-8v54M174 116V64l14 8v44M200 116V82h18v34M226 116V56h14v60M248 116V88h22v28"
        {...outline}
        strokeWidth={2.6}
      />
    </svg>
  );
}
