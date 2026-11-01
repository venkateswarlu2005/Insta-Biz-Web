const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Heart with a pulse line. */
export const HeartIcon = () => (
  <>
    <path d="M32 54C16 43 8 34 8 24c0-7 5.4-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 6.6 0 12 5 12 12 0 10-8 19-24 30z" {...s} />
    <path d="M22 30h7l3-7 4 13 3-6h7" {...s} />
  </>
);

/** Plane with a dotted trail. */
export const PlaneIcon = () => (
  <>
    <path d="M6 36l22-3 12-17h6l-6 17 12-1 6-7h3l-2 10 2 10h-3l-6-7-12-1 6 17h-6L28 37 6 36z" {...s} />
    <path d="M8 50c10 4 20 4 30 0" {...s} strokeDasharray="2 7" />
  </>
);

/** Speech bubble. */
export const ChatIcon = () => (
  <>
    <path d="M10 14h44v28H30l-12 10v-10h-8z" {...s} />
    <path d="M22 28h0M32 28h0M42 28h0" {...s} strokeWidth={5} />
  </>
);
