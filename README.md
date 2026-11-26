# Thiệp cưới Tiên & Huyền · 23.01.2027

Astro static, 0 framework runtime. Kế hoạch: [PLAN.md](PLAN.md) · luật cho Claude Code: [CLAUDE.md](CLAUDE.md).

```bash
npm install
npm run dev                      # http://localhost:4321/k/tuan-x7k2 (dữ liệu từ fixtures/)
npm run build && npm run budget  # build + kiểm ngân sách, luật cứng
```

## Đưa lên mạng (M0)

1. **Sheet**: 2 file. File danh sách cũ giữ các tab "Khách …" (mọi người nhập khách ở đó). File thiệp (`ThiepCuoiBegi`) import từ `Guests-import.xlsx`, có tab `Guests`, `TongHop`, `Config`, `HuongDan`. Cột xem PLAN §2. `xungHo` là dropdown 8 giá trị, `showGift` là hộp kiểm. Khoá cột `guestID` bằng Protected range. Tab `Config` do admin tự tạo khi mở Sheet: điền số của Mai vào ô `sdtHoTro`.
2. **Admin** (Tiện ích mở rộng → Apps Script **trong file thiệp**): dán `apps-script/admin/Code.js`, Script Properties `NGUON_SHEET_ID` = ID file danh sách cũ. Mở lại Sheet → menu **Thiệp cưới**: *Cập nhật khách từ danh sách cũ* (đồng bộ các tab "Khách …" sang `Guests`), *Sinh guestID cho dòng trống* (chỉ dòng `kenh = online`), *Build lại thiệp*.
3. **API** (project Apps Script riêng): dán `apps-script/api/`. Script Properties: `SHEET_ID` (ID **file thiệp**), `TOKEN` (chuỗi ngẫu nhiên dài). Deploy → Web app, Execute as **Me**, Access **Anyone**. Lần sau đổi code: Manage deployments → Edit → New version (giữ URL).
4. **Cloudflare Workers**: Workers & Pages → Create application → Import a repository → repo này. Worker `damcuoitienhuyen` (trùng `name` trong `wrangler.jsonc`), build `npm run build`, deploy `npx wrangler deploy`. **Build variables**: `SHEET_API_URL`, `SHEET_TOKEN`, `PUBLIC_API_URL`, `SITE_URL` (bắt buộc khi chưa có domain, để og:image có ảnh; gắn domain xong thì xoá). Gắn domain ở Settings → Domains & Routes.
5. Worker → Settings → Builds → **Deploy Hooks** → dán URL vào Script Properties `DEPLOY_HOOK` của admin. Từ đó sửa Sheet xong bấm **Build lại thiệp**.
6. Kiểm: `curl -sI https://<host>/k/<guestID>` (host: workers.dev hoặc tên miền đã mua) phải `200`, không có `Location`.

## Thay nội dung thật (M4, trước 20/12)

- Ảnh: ghi đè file trong `src/assets/photos/` giữ nguyên tên (ảnh hiện tại là ảnh giả có hạt film, cố ý nặng như ảnh thật để đo tốc độ sát thực tế). Đổi ảnh xong chạy lại PageSpeed. `src/assets/og.jpg` 1200×630 JPEG (URL có hash nên Zalo không dính ảnh cũ). `src/assets/gift-qr.png` = QR ngân hàng.
- Số của Mai: ô `sdtHoTro` tab Config trong Sheet → Build lại thiệp.
- `src/config/wedding.ts`: YouTube ID, STK, link Google Maps (các dòng `TODO`).
- `npm run budget -- --strict` phải pass.

Font: Be Vietnam Pro, Playwrite VN (SIL OFL 1.1, xem `src/assets/fonts/OFL-*.txt`).
