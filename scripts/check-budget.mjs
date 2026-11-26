// npm run budget — chạy sau `npm run build`. Fail (exit 1) nếu vượt ngân sách hoặc phạm luật cứng.
// `npm run budget -- --strict`: coi các ô TODO nội dung là lỗi (dùng từ content freeze 20/12).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { WEDDING } from '../src/config/wedding.ts';

const DIST = 'dist';
const KB = 1024;
const LIMIT = { htmlGz: 30 * KB, js: 5 * KB, fonts: 80 * KB, eager: 150 * KB, lazy: 800 * KB };
const strict = process.argv.includes('--strict');
const errors = [];
const warns = [];
const kb = (n) => `${(n / KB).toFixed(1)}KB`;

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST);
const size = (url) => statSync(join(DIST, url.split('?')[0])).size;
const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const hwChars = new Set([...readFileSync('scripts/hw-chars.txt', 'utf8').replace(/\n/g, '')]);

// Ảnh: với mỗi <picture> lấy ứng viên AVIF lớn nhất (trường hợp xấu nhất: màn hình DPR 3)
function images(html) {
  const out = [];
  for (const m of html.matchAll(/<picture>(.*?)<\/picture>/gs)) {
    // thứ tự thuộc tính không cố định (Astro xuất srcset trước type) → tìm thẻ <source> AVIF rồi mới lấy srcset
    const avifTag = m[1].match(/<source\b[^>]*type="image\/avif"[^>]*>/)?.[0];
    const avif = avifTag?.match(/srcset="([^"]+)"/)?.[1];
    const img = m[1].match(/<img[^>]*>/)[0];
    const urls = (avif ?? img.match(/src="([^"]+)"/)[1]).split(',').map((s) => s.trim().split(/\s+/)[0]);
    out.push({ url: urls.at(-1), bytes: Math.max(...urls.map(size)), eager: /fetchpriority="high"/.test(img) });
  }
  const rest = html.replace(/<picture>.*?<\/picture>/gs, '');
  for (const m of rest.matchAll(/<img[^>]*src="(\/[^"]+)"[^>]*>/g)) {
    const urls = (m[0].match(/srcset="([^"]+)"/)?.[1] ?? m[1]).split(',').map((s) => s.trim().split(/\s+/)[0]);
    out.push({ url: urls.at(-1), bytes: Math.max(...urls.map(size)), eager: /fetchpriority="high"/.test(m[0]), gift: /gift-qr/.test(m[1]) });
  }
  return out;
}

const pages = files.filter((f) => f.endsWith('.html'));
let worst = { gz: 0, js: 0, eager: 0, lazy: 0 };
for (const file of pages) {
  const name = relative(DIST, file);
  const html = readFileSync(file, 'utf8');
  const gz = gzipSync(html, { level: 9 }).length;
  if (gz > LIMIT.htmlGz) errors.push(`${name}: HTML ${kb(gz)} gzip > ${kb(LIMIT.htmlGz)}`);

  const js = [...html.matchAll(/<script(?![^>]*type="application\/(?:ld\+)?json")[^>]*>(.*?)<\/script>/gs)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  if (js > LIMIT.js) errors.push(`${name}: JS inline ${kb(js)} > ${kb(LIMIT.js)}`);
  if (/<script[^>]+src=/.test(html)) errors.push(`${name}: có <script src>, chỉ được dùng script inline`);

  // 0 request bên thứ 3 trước khi hiển thị: mọi tài nguyên phải cùng origin
  for (const m of html.matchAll(/<(?:img|source|script|link|iframe|video|audio)\b[^>]*>/g)) {
    const tag = m[0];
    if (/^<link/.test(tag) && !/rel="(?:stylesheet|preload|modulepreload|icon|preconnect|dns-prefetch)"/.test(tag)) continue;
    const refs = [...tag.matchAll(/(?:src|href|srcset)="([^"]+)"/g)].map((x) => x[1]);
    if (refs.some((r) => /(^|,\s*)(https?:)?\/\//.test(r))) errors.push(`${name}: tài nguyên ngoài origin: ${tag.slice(0, 120)}`);
  }
  if (/<iframe\b/.test(html)) errors.push(`${name}: có iframe`);
  if (/<(?:audio|video)\b[^>]*\bautoplay\b/.test(html)) errors.push(`${name}: có autoplay`);
  if (!/<meta name="robots" content="noindex/.test(html)) errors.push(`${name}: thiếu meta noindex`);

  // Quà mừng: trang không bật showGift không được chứa QR/STK
  const hasGift = /<details class="gift"/.test(html);
  if (!hasGift && (html.includes(WEDDING.gift.account) || /gift-qr/.test(html))) errors.push(`${name}: lộ QR/STK dù showGift = false`);

  // Chữ viết tay phải nằm trong bộ ký tự đã subset của Playwrite VN
  for (const m of html.matchAll(/<(\w+)[^>]*class="[^"]*\bhw\b[^"]*"[^>]*>(.*?)<\/\1>/gs)) {
    const miss = [...new Set([...decode(m[2])].filter((ch) => !hwChars.has(ch)))];
    if (miss.length) errors.push(`${name}: chữ viết tay "${decode(m[2])}" dùng ký tự chưa subset: ${miss.join(' ')} → thêm vào scripts/hw-chars.txt rồi chạy scripts/subset-fonts.sh`);
  }

  const imgs = images(html);
  const eager = imgs.filter((i) => i.eager);
  for (const i of eager) if (i.bytes > LIMIT.eager) errors.push(`${name}: ảnh màn 1 ${kb(i.bytes)} > ${kb(LIMIT.eager)} (${i.url})`);
  const seen = new Set();
  const lazy = imgs.filter((i) => !i.eager && !i.gift && !seen.has(i.url) && seen.add(i.url)).reduce((n, i) => n + i.bytes, 0);
  if (lazy > LIMIT.lazy) errors.push(`${name}: ảnh lazy ${kb(lazy)} > ${kb(LIMIT.lazy)}`);

  worst = {
    gz: Math.max(worst.gz, gz),
    js: Math.max(worst.js, js),
    eager: Math.max(worst.eager, ...eager.map((i) => i.bytes), 0),
    lazy: Math.max(worst.lazy, lazy),
  };
}

const fonts = files.filter((f) => f.endsWith('.woff2')).reduce((n, f) => n + statSync(f).size, 0);
if (fonts > LIMIT.fonts) errors.push(`Font ${kb(fonts)} > ${kb(LIMIT.fonts)}`);

// Nhạc: chỉ tải khi khách chạm ▶. Opus ≤ 400KB, AAC dự phòng ≤ 700KB
for (const f of files.filter((f) => /\.(webm|m4a)$/.test(f))) {
  const n = statSync(f).size, lim = (f.endsWith('.webm') ? 400 : 700) * KB;
  if (n > lim) errors.push(`Nhạc ${relative(DIST, f)} ${kb(n)} > ${kb(lim)}`);
}

// Nội dung còn để trống
const sample = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!/data-helper/.test(sample)) warns.push(`Sheet: ô sdtHoTro (tab Config) trống → thiệp đang ẩn dòng "Lạc đường? Gọi ${WEDDING.helper.name}"`);
else if (/tel:0900000000/.test(sample)) warns.push('Đang build bằng số mẫu trong fixtures/config.sample.json (chưa nối Sheet)');
if (!WEDDING.youtubeId) warns.push('wedding.ts: chưa có youtubeId phim cưới');
if (/x{3}/i.test(WEDDING.gift.account)) warns.push('wedding.ts: STK quà mừng vẫn là placeholder');
if (WEDDING.venue.mapsUrl.includes('/maps/search/')) warns.push('wedding.ts: mapsUrl đang là link tìm kiếm, nên thay bằng link chia sẻ của đúng địa điểm');
if (strict) errors.push(...warns.splice(0));

console.log(`${pages.length} trang · HTML max ${kb(worst.gz)} gzip · JS max ${kb(worst.js)} · font ${kb(fonts)} · ảnh màn 1 max ${kb(worst.eager)} · ảnh lazy max ${kb(worst.lazy)}`);
for (const w of warns) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) process.exit(1);
console.log('✓ Budget OK');
