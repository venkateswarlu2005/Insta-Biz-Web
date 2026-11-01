// Pre-builds responsive WebP copies of every image in public/media (and new CMS uploads),
// so the static site never ships a full-size original to a phone.
//   public/media/a/b.jpg  ->  public/_img/media/a/b.jpg.w640.webp  (one per width)
// Also writes lib/generated/images.json with each image's size, used for layout and placeholders.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIRS = ['public/media', 'public/uploads'];
const OUT = path.join(ROOT, 'public/_img');
const MANIFEST = path.join(ROOT, 'lib/generated/images.json');
// Keep in sync with deviceSizes + imageSizes in next.config.mjs
export const WIDTHS = [96, 160, 320, 640, 960, 1440, 1920];
const IMAGE = /\.(jpe?g|png|webp|avif|gif)$/i;

async function* walk(dir) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (IMAGE.test(e.name)) yield p;
  }
}

const isFresh = async (out, srcMtime) => {
  try { return (await fs.stat(out)).mtimeMs >= srcMtime; } catch { return false; }
};

const manifest = {};
let made = 0;
let total = 0;
const jobs = [];
for (const dir of SRC_DIRS) {
  for await (const file of walk(path.join(ROOT, dir))) jobs.push(file);
}

async function processFile(file) {
  const rel = '/' + path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/');
  const { mtimeMs } = await fs.stat(file);
  const meta = await sharp(file).metadata();
  const w = meta.autoOrient?.width ?? meta.width;
  const h = meta.autoOrient?.height ?? meta.height;
  manifest[rel] = { width: w, height: h };
  for (const width of WIDTHS) {
    const out = path.join(OUT, rel + `.w${width}.webp`);
    total++;
    if (await isFresh(out, mtimeMs)) continue;
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toFile(out);
    made++;
  }
}

// small worker pool
const queue = [...jobs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) await processFile(queue.shift());
}));

await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 0));
console.log(`images: ${jobs.length} sources, ${made}/${total} variants built`);
