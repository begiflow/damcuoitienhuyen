# Thiệp cưới Tiên & Huyền · 23.01.2027

Astro static, 0 framework runtime. Kế hoạch: [PLAN.md](PLAN.md) · luật cho Claude Code: [CLAUDE.md](CLAUDE.md).

```bash
npm install
npm run dev                      # http://localhost:4321/k/tuan-x7k2 (dữ liệu từ fixtures/)
npm run build && npm run budget  # build + kiểm ngân sách, luật cứng
```

## Đưa lên mạng (M0)

1. **Sheet**: import `Guests-import.xlsx` (File → Import → Upload → *Chèn trang tính mới*) để có tab `Guests`, `TongHop`, `Config`, `HuongDan`. Cột xem PLAN §2. `xungHo` là dropdown 8 giá trị, `showGift` là hộp kiểm. Khoá cột `guestID` bằng Protected range. Tab `Config` do admin tự tạo khi mở Sheet: điền số của Mai vào ô `sdtHoTro`.
2. **Admin** (Tiện ích mở rộng → Apps Script trong file Sheet): dán `apps-script/admin/Code.js`. Mở lại Sheet → menu **Thiệp cưới**: *Cập nhật khách từ danh sách cũ* (đồng bộ các tab "Khách …" sang `Guests`), *Sinh guestID cho dòng trống* (chỉ dòng `kenh = online`), *Build lại thiệp*.
3. **API** (project Apps Script riêng): dán `apps-script/api/`. Script Properties: `SHEET_ID`, `TOKEN` (chuỗi ngẫu nhiên dài). Deploy → Web app, Execute as **Me**, Access **Anyone**. Lần sau đổi code: Manage deployments → Edit → New version (giữ URL).
4. **Cloudflare Pages**: nối repo GitHub, build `npm run build`, output `dist`. Biến môi trường Production: `SHEET_API_URL`, `SHEET_TOKEN`, `PUBLIC_API_URL` (xem `.env.example`). Gắn domain `tienvahuyen.com`.
5. Pages → Settings → Builds → **Deploy hook** → dán URL vào Script Properties `DEPLOY_HOOK` của admin. Từ đó sửa Sheet xong bấm **Build lại thiệp**.
6. Kiểm: `curl -sI https://tienvahuyen.com/k/<guestID>` phải `200`, không có `Location`.

## Thay nội dung thật (M4, trước 20/12)

- Ảnh: ghi đè file trong `src/assets/photos/` giữ nguyên tên. `public/og.jpg` 1200×630. `src/assets/gift-qr.png` = QR ngân hàng.
- Số của Mai: ô `sdtHoTro` tab Config trong Sheet → Build lại thiệp.
- `src/config/wedding.ts`: YouTube ID, STK, link Google Maps (các dòng `TODO`).
- `npm run budget -- --strict` phải pass.

Font: Be Vietnam Pro, Playwrite VN (SIL OFL 1.1, xem `src/assets/fonts/OFL-*.txt`).
