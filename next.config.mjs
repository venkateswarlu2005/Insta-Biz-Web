/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `next build` writes plain HTML/CSS/JS to /out for Cloudflare Pages.
  output: 'export',
  // Lets two dev servers run side by side (e.g. NEXT_DIST_DIR=.next-b next dev -p 3001).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    // Images are pre-resized to WebP by scripts/optimize-images.mjs; the loader just picks a width.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    deviceSizes: [320, 640, 960, 1440, 1920],
    imageSizes: [96, 160],
  },
  reactStrictMode: true,
};

export default nextConfig;
