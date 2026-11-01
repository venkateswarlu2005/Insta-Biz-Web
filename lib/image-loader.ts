'use client';

// next/image custom loader for the static export: points at the WebP variants
// that scripts/optimize-images.mjs builds into /public/_img.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith('/media/') && !src.startsWith('/uploads/')) return src;
  return `/_img${src}.w${width}.webp`;
}
