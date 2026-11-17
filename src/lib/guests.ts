// Đọc danh sách khách LÚC BUILD. Trang khách không bao giờ gọi Sheet.
// Có SHEET_API_URL → bắt buộc lấy được từ Apps Script, lỗi thì fail build (không lặng lẽ dùng fixtures).
// Không có → fixtures/guests.sample.json (dev, preview).

import fixtures from '../../fixtures/guests.sample.json';
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

async function fetchRows(): Promise<unknown> {
  const url = env('SHEET_API_URL');
  if (!url) {
    console.warn('[guests] Không có SHEET_API_URL → dùng fixtures/guests.sample.json');
    return fixtures;
  }
  const token = env('SHEET_TOKEN');
  if (!token) throw new Error('Có SHEET_API_URL nhưng thiếu SHEET_TOKEN.');
  const res = await fetch(`${url}?action=guests&token=${encodeURIComponent(token)}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Apps Script trả HTTP ${res.status}.`);
  const body = (await res.json()) as { ok?: boolean; guests?: unknown; error?: string };
  if (!body.ok) throw new Error(`Apps Script từ chối: ${body.error ?? 'không rõ lỗi'}.`);
  return body.guests;
}

let cache: Promise<Guest[]> | undefined;

export function loadGuests(): Promise<Guest[]> {
  cache ??= (async () => {
    const rows = await fetchRows();
    if (!Array.isArray(rows)) throw new Error('Danh sách khách không phải mảng.');
    const guests = rows.map((r, i) => toGuest(r as Record<string, unknown>, i));
    const seen = new Set<string>();
    for (const g of guests) {
      if (seen.has(g.guestID)) throw new Error(`guestID bị trùng: ${g.guestID}`);
      seen.add(g.guestID);
    }
    console.log(`[guests] ${guests.length} khách`);
    return guests;
  })();
  return cache;
}
