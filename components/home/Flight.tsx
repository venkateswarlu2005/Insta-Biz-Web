'use client';

import { useMotionValueEvent, useScroll } from 'motion/react';
import { useCallback, useEffect, useId, useRef } from 'react';
import imageLoader from '@/lib/image-loader';
import { useReducedMotion } from '@/lib/motion';

/**
 * "Imported for you": a little plane with a puppy in the porthole flies the dotted
 * route from Korea to Dubai as the scene scrolls through the viewport.
 */
export function Flight({ photo, label }: { photo?: string; label: string }) {
  // a 50px porthole: the smallest pre-resized copy is plenty
  const porthole = photo && imageLoader({ src: photo, width: 160 });
  const boxRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  const clipId = `tp-flight${useId().replace(/[^\w-]/g, '')}`;
  const { scrollYProgress } = useScroll({ target: boxRef, offset: ['start 95%', 'end 25%'] });

  const place = useCallback((p: number) => {
    const route = routeRef.current;
    const plane = planeRef.current;
    if (!route || !plane) return;
    const len = route.getTotalLength();
    const at = Math.min(len, Math.max(0, p * len));
    const pt = route.getPointAtLength(at);
    const ahead = route.getPointAtLength(Math.min(len, at + 1));
    const behind = route.getPointAtLength(Math.max(0, at - 1));
    const angle = (180 * Math.atan2(ahead.y - behind.y, ahead.x - behind.x)) / Math.PI;
    plane.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    // the plane takes off just after the scene enters
    plane.style.opacity = String(Math.min(1, Math.max(0, (p - 0.11) / 0.06)));
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', (p) => !reduced && place(p));
  useEffect(() => place(reduced ? 0.62 : scrollYProgress.get()), [reduced, scrollYProgress, place]);

  return (
    <div ref={boxRef} className="tp-flight">
      <svg viewBox="0 0 660 300" role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <circle r="25" />
          </clipPath>
        </defs>
        <path ref={routeRef} d="M40 250 C 170 40, 470 20, 620 168" className="tp-flight__route" />
        <circle cx="40" cy="250" r="7" className="tp-flight__dot" />
        <circle cx="620" cy="168" r="7" className="tp-flight__dot" />
        <text x="40" y="284" textAnchor="middle" className="tp-flight__label">
          Korea
        </text>
        <text x="620" y="202" textAnchor="middle" className="tp-flight__label">
          Dubai
        </text>
        <g ref={planeRef} transform="translate(410 70)">
          <g transform="translate(-126 -78)">
            <path d="M28 60 L8 26 L34 26 L60 54 Z" className="tp-flight__wing" />
            <path d="M108 112 L142 156 L172 156 L158 112 Z" className="tp-flight__wing tp-flight__wing--far" />
            <path
              d="M20 80 C20 52 52 44 80 44 L168 44 C200 44 224 60 232 80 C224 100 200 112 168 112 L80 112 C52 112 20 104 20 80 Z"
              className="tp-flight__body"
            />
            <path d="M104 44 L138 2 L168 2 L154 44 Z" className="tp-flight__wing" />
            <path d="M206 64 C215 67 221 73 224 80" className="tp-flight__line" />
          </g>
          {porthole && (
            <g transform="translate(10 2)">
              <image href={porthole} x="-25" y="-25" width="50" height="50" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
              <circle r="25" className="tp-flight__porthole" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
