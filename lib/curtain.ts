'use client';

// Shared state for the page-transition curtain (components/pup/RouteCurtain.tsx).
// The curtain element's data-state is the source of truth:
//   intro    first load: the blanket is already down and lifts after 0.56s (CSS)
//   covering the blanket is sliding down over the old page
//   covered  fully down; the next page is being fetched
//   snap     back/forward navigation: shown instantly
//   lifting  the new page is in place and the blanket slides away
//   idle     hidden
// While it covers the screen, scroll reveals wait and fire once it lifts (EVENTS.arrived).

/** ms since the intro curtain started (the 0s `tp-curtain-rest` CSS animation, delayed 1.04s), or Infinity once done */
export function introElapsed() {
  const rest = document
    .querySelector('.tp-curtain')
    ?.getAnimations()
    .find((a) => (a as CSSAnimation).animationName === 'tp-curtain-rest');
  return rest && rest.playState !== 'finished' && typeof rest.currentTime === 'number' ? rest.currentTime : Infinity;
}

/** true while the curtain hides the page (so on-screen reveals should wait) */
export function curtainDown() {
  if (typeof document === 'undefined') return false;
  const state = document.querySelector<HTMLElement>('.tp-curtain')?.dataset.state;
  return (state === 'intro' && introElapsed() < 560) || state === 'covering' || state === 'covered' || state === 'snap';
}
