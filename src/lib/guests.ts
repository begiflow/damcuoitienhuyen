// Đọc danh sách khách LÚC BUILD. Trang khách không bao giờ gọi Sheet.
// Có SHEET_API_URL → bắt buộc lấy được từ Apps Script, lỗi thì fail build (không lặng lẽ dùng fixtures).
// Không có → fixtures/ (dev, preview).

import fixtures from '../../fixtures/guests.sample.json';
import fixtureConfig from '../../fixtures/config.sample.json';
import { isXungHo, PRESETS, type XungHo } from '../config/xungho';

export type Guest = {
  guestID: string;
  ten: string;
  xungHo: XungHo;
  diCung: string;
  handle: string;
  showGift: boolean;
};

const ID_RE = /^[a-z0-9-]{4,40}$/;
const HANDLE_MAX = 22;

const nfc = (v: unknown) => (v == null ? '' : String(v)).normalize('NFC').trim();

export function slugHandle(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, HANDLE_MAX)
    .replace(/\.+$/, '');
}

function toGuest(row: Record<string, unknown>, i: number): Guest {
  const where = `dòng ${i + 2} (guestID "${row.guestID ?? ''}")`;
  const guestID = nfc(row.guestID);
  if (!ID_RE.test(guestID)) throw new Error(`guestID không hợp lệ ở ${where}: chỉ a-z, 0-9, "-", dài 4–40.`);
  const ten = nfc(row.ten);
  if (!ten) throw new Error(`Thiếu cột "ten" ở ${where}.`);
  const raw = nfc(row.xungHo).toLowerCase();
  if (raw && !isXungHo(raw)) console.warn(`[guests] xungHo "${raw}" không hợp lệ ở ${where} → dùng "ban".`);
  const xungHo: XungHo = isXungHo(raw) ? raw : 'ban';
  const goi = PRESETS[xungHo].goi;
  const handle = slugHandle(nfc(row.handle) || (xungHo === 'ban' ? ten : `${goi} ${ten}`)) || 'ban';
  const g = row.showGift;
  return {
    guestID,
    ten,
    xungHo,
    diCung: nfc(row.diCung),
    handle,
    showGift: g === true || String(g).toUpperCase() === 'TRUE',
  };
}

const env = (k: string): string | undefined => import.meta.env[k] || process.env[k];

export type SheetConfig = {
  sdtHoTro: string; // "" = chưa điền → ẩn dòng "Lạc đường?"
};

// Ô số điện thoại có thể bị Sheet hiểu là số và mất số 0 đầu → tự thêm lại.
export function normalizePhone(v: unknown): string {
  let s = nfc(v).replace(/[\s.\-()]/g, '');
  if (!s) return '';
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  if (/^[1-9]\d{8}$/.test(s)) s = '0' + s;
  if (!/^0\d{9}$/.test(s)) throw new Error(`Ô sdtHoTro trong tab Config không phải số di động VN 10 số: "${nfc(v)}"`);
  return s;
}

type Raw = { guests: unknown; config: unknown };

async function fetchSheet(): Promise<Raw> {
  const url = env('SHEET_API_URL');
  if (!url) {
    console.warn('[guests] Không có SHEET_API_URL → dùng fixtures/');
    return { guests: fixtures, config: fixtureConfig };
  }
  const token = env('SHEET_TOKEN');
  if (!token) throw new Error('Có SHEET_API_URL nhưng thiếu SHEET_TOKEN.');
  const res = await fetch(`${url}?action=guests&token=${encodeURIComponent(token)}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Apps Script trả HTTP ${res.status}.`);
  const body = (await res.json()) as { ok?: boolean; guests?: unknown; config?: unknown; error?: string };
  if (!body.ok) throw new Error(`Apps Script từ chối: ${body.error ?? 'không rõ lỗi'}.`);
  return { guests: body.guests, config: body.config };
}

let cache: Promise<{ guests: Guest[]; config: SheetConfig }> | undefined;

function loadSheet() {
  cache ??= (async () => {
    const raw = await fetchSheet();
    const rows = raw.guests;
    if (!Array.isArray(rows)) throw new Error('Danh sách khách không phải mảng.');
    const guests = rows.map((r, i) => toGuest(r as Record<string, unknown>, i));
    const seen = new Set<string>();
    for (const g of guests) {
      if (seen.has(g.guestID)) throw new Error(`guestID bị trùng: ${g.guestID}`);
      seen.add(g.guestID);
    }
    const cfg = (raw.config ?? {}) as Record<string, unknown>;
    const config: SheetConfig = { sdtHoTro: normalizePhone(cfg.sdtHoTro) };
    if (!config.sdtHoTro) console.warn('[guests] Ô sdtHoTro (tab Config) đang trống → ẩn dòng "Lạc đường?"');
    console.log(`[guests] ${guests.length} khách`);
    return { guests, config };
  })();
  return cache;
}

export const loadGuests = async () => (await loadSheet()).guests;
export const loadConfig = async () => (await loadSheet()).config;
