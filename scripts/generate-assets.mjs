#!/usr/bin/env node
// Generates launcher icons, splash, favicon, in-app logo and Play Store graphics
// from assets/brand/logo-source.jpg. Run with `npm run assets`.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets/brand/logo-source.jpg');
const IMAGES = path.join(root, 'assets/images');
const STORE = path.join(root, 'store');
const BRAND_NAVY = '#1E3A8A';
const out = (dir, name) => path.join(dir, name);

/** Drops leading rows that are mostly dark (screenshot chrome above the badge). */
async function dropDarkTopRows(input) {
  const { data, info } = await sharp(input).greyscale().raw().toBuffer({ resolveWithObject: true });
  let top = 0;
  for (let y = 0; y < Math.min(info.height, 40); y++) {
    let sum = 0;
    for (let x = 0; x < info.width; x++) sum += data[y * info.width + x];
    if (sum / info.width > 200) break;
    top = y + 1;
  }
  return sharp(input)
    .extract({ left: 0, top, width: info.width, height: info.height - top })
    .toBuffer();
}

/** Square, tightly cropped badge with transparent corners. */
async function roundLogo() {
  const cleaned = await dropDarkTopRows(SRC);
  const trimmed = await sharp(cleaned).trim({ background: '#ffffff', threshold: 40 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const size = Math.max(meta.width, meta.height);
  const pad = Math.round(size * 0.02);
  const { data, info } = await sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: '#ffffff' })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  clearBackground(data, info.width, info.height);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** Flood-fills near-white pixels connected to the image border to transparent, with a soft edge. */
function clearBackground(data, w, h) {
  const lum = (p) => 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const l = lum(p);
    if (l < 200) continue;
    data[p * 4 + 3] = l >= 235 ? 0 : Math.round(((235 - l) / 35) * 255);
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
}

/** White silhouette of the dark (navy/teal) strokes, transparent elsewhere. */
async function silhouette(logo) {
  const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const outBuf = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const on = data[i + 3] > 128 && lum < 150;
    outBuf[i] = outBuf[i + 1] = outBuf[i + 2] = 255;
    outBuf[i + 3] = on ? 255 : 0;
  }
  return sharp(outBuf, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const canvas = (size, background) =>
  sharp({ create: { width: size, height: size, channels: 4, background } });

async function centered(logo, size, scale, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const inner = Math.round(size * scale);
  const img = await sharp(logo).resize(inner, inner).toBuffer();
  return canvas(size, background).composite([{ input: img, gravity: 'center' }]).png();
}

async function featureGraphic(logo) {
  const W = 1024;
  const H = 500;
  const logoSize = 380;
  const img = await sharp(logo).resize(logoSize, logoSize).toBuffer();
  const text = Buffer.from(`
    <svg width="${W}" height="${H}">
      <text x="470" y="225" font-family="Helvetica, Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">SGT Admin</text>
      <text x="472" y="290" font-family="Helvetica, Arial, sans-serif" font-size="38" fill="#C7D2FE">Sri Gopal Traders</text>
      <text x="472" y="340" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#93C5FD">Orders · Stock · Purchases · Reports</text>
    </svg>`);
  return sharp({ create: { width: W, height: H, channels: 3, background: BRAND_NAVY } })
    .composite([
      { input: img, left: 60, top: Math.round((H - logoSize) / 2) },
      { input: text, left: 0, top: 0 },
    ])
    .png();
}

async function main() {
  await mkdir(IMAGES, { recursive: true });
  await mkdir(STORE, { recursive: true });
  const logo = await roundLogo();
  const mono = await silhouette(logo);
  const white = { r: 255, g: 255, b: 255, alpha: 1 };

  await sharp(logo).resize(1024, 1024).toFile(out(IMAGES, 'logo.png'));
  await (await centered(logo, 1024, 0.88, white)).flatten({ background: '#ffffff' }).toFile(out(IMAGES, 'icon.png'));
  await (await centered(logo, 1024, 0.62)).toFile(out(IMAGES, 'android-icon-foreground.png'));
  await canvas(1024, white).png().toFile(out(IMAGES, 'android-icon-background.png'));
  await (await centered(mono, 1024, 0.62)).toFile(out(IMAGES, 'android-icon-monochrome.png'));
  await sharp(logo).resize(1024, 1024).toFile(out(IMAGES, 'splash-icon.png'));
  await (await centered(logo, 48, 0.94, white)).toFile(out(IMAGES, 'favicon.png'));
  await (await centered(logo, 512, 0.88, white)).flatten({ background: '#ffffff' }).removeAlpha().toFile(out(STORE, 'play-icon-512.png'));
  await (await featureGraphic(logo)).removeAlpha().toFile(out(STORE, 'feature-graphic-1024x500.png'));
  console.log('Assets written to assets/images and store/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
