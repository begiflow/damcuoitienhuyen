# CLAUDE.md — Thiệp cưới online (Story)

## Bối cảnh
Thiệp cưới online cho tiệc cưới **Thứ Bảy 23/01/2027** tại TP.HCM, gửi chủ yếu bạn bè qua Zalo. Mỗi khách 1 link `/k/<guestID>`; trang mở trong trình duyệt của Zalo/Messenger trên 4G.
Thiết kế: **6 màn kiểu story** (xem PLAN §4, mockup: `design/story-mockup.dc.html`, tức artboard 1 trên canvas). Kế hoạch và phạm vi: **PLAN.md**. Cái gì không có trong PLAN thì không làm.

**Mục tiêu số 1: load nhanh nhất.** Phân vân giữa đẹp hơn và nhẹ hơn → chọn nhẹ hơn.

## Luật cứng (không vi phạm)
1. Không framework runtime, không hydration. JS chỉ là `<script>` vanilla inline, tổng ≤ 5KB.
2. **0 request bên thứ 3 trước khi trang hiển thị.** Sheet/Apps Script **chỉ** được đọc lúc build; lúc chạy chỉ gọi khi bấm Gửi RSVP và beacon lượt xem (sau 2s).
3. Không autoplay âm thanh/video, không iframe, không đăng nhập, không tải file (trừ `.ics`), không xin quyền.
4. URL khách trả **200 trực tiếp**: `build.format: 'file'`, `trailingSlash: 'never'`. Không đưa tên hay xưng hô lên query param.
5. Build output không chứa `sdt`, `nhom` hay cột nội bộ. QR/STK chỉ render khi `showGift === true`.
6. **guestID bất biến.** Không viết code đổi/sinh lại guestID đã có.
7. **Không hardcode đại từ.** Mọi câu chữ hướng tới khách đi qua preset trong `src/config/xungho.ts` (`goi`, `minh`, `le`). Preset có lễ (`co`, `chu`, `thay`) dùng câu lịch sự, không dùng câu đùa.
8. Mọi chuỗi từ Sheet `.normalize('NFC')`. Không `set:html` với dữ liệu khách.
9. `noindex` (meta + `X-Robots-Tag`); robots.txt **không** Disallow. og:image là JPEG tuyệt đối, không chứa QR/STK.
10. RSVP **mặc định chưa chọn**; nút Gửi khoá tới khi khách chọn. Nhãn số người là "Số người tham dự" (không dùng "Đi mấy người?"). Tiệc mặn, menu cố định: không gợi ý ăn chay hay chọn món ở bất kỳ đâu.
11. Không thêm dependency khi chưa hỏi. Lời giải ít code nhất.

## Performance budget (`npm run budget` fail nếu vượt)
HTML ≤ 30KB gzip · font ≤ 80KB · ảnh màn 1 ≤ 150KB (eager) · ảnh còn lại lazy ≤ 800KB · Lighthouse mobile Perf ≥ 95, LCP ≤ 2.0s, CLS < 0.05.

## UI rules
- Mỗi màn `height: clamp(640px, 100svh, 760px)`; nội dung dùng flex (đỉnh/đáy), **không** định vị tuyệt đối theo px cố định cho nội dung chính. Phải đúng ở 360×640 và 390×844.
- **Như story:** các màn xếp ngang trong `main.story` (`overflow-x: auto`), vuốt ngang sang đúng 1 màn: `scroll-snap-type: x mandatory` + `scroll-snap-stop: always`. Thanh tiến trình + dòng tài khoản là **1 lớp phủ đứng yên** (`.hud` trong `Story.astro`), không nằm trong từng màn; JS chỉ đổi `--i` (đoạn đang xem) và `.ink` (chữ mực trên màn giấy). Trang không được cuộn dọc ở 360×640 và 390×844. **Mở trang không được tự cuộn** (Chrome coi là người dùng cuộn → NO_LCP). Đặt tên class mới phải tránh trùng (`.frame` là khung polaroid).
- Chạm 28% cạnh phải/trái = `scrollIntoView({ inline: 'start', block: 'nearest' })` màn sau/trước. Vùng chạm nằm **dưới** nội dung; nội dung `pointer-events: none`, phần tử bấm được `pointer-events: auto`.
- **Font (theo thiệp mẫu cô dâu chọn):** Cormorant Garamond **500–700** (1 file variable, `font-variant-numeric: lining-nums` cho số thẳng hàng; đừng gộp vào `font:` vì bộ nén CSS đảo thứ tự làm mất) cho mọi chữ; Great Vibes 400 chỉ cho câu viết tay (`.hw`) và chữ ký (SVG outline, `scripts/signature.py`). Dòng tài khoản `.acct` + nhãn mention dùng chữ hệ thống (giao diện story, không tải font). Tự viết `@font-face`, subset bằng `scripts/subset-fonts.sh`.
- **Bố cục giấy** (theo góp ý của cô dâu, tham khảo các mẫu thiệp online đang được chuộng): nền giấy `--paper`/`--soft` xen kẽ, màn 6 nền `--accent`; căn giữa, nhiều khoảng trống, **mỗi màn 1 điểm nhấn**. **Giấy trên ảnh** (giữ chất story): màn 1, 2, 3, 4 có ảnh tràn màn làm nền (`Screen` prop `bg`), nội dung nằm trên tờ giấy xé mép dán băng keo (`.sheet`), không đặt chữ trực tiếp lên ảnh (trừ nhãn mention); màn 5, 6 là màn giấy/màu. Ảnh còn lại đóng khung polaroid + băng keo. Không chữ trong hộp màu; tiêu đề serif đậm 700 cỡ vừa, chữ phụ nhỏ, kicker viết hoa giãn chữ. Nút viền mực bo tròn. **Đậm 700 chỉ cho tiêu đề + 1 thông tin chính mỗi màn** (ngày, giờ, Hidden Haven, nút Gửi); nút/nhãn/số đếm 600; chữ thường 500. **Màu tím nhấn chỉ 3 vai:** chữ ký tên, con số/giờ, nút hành động. Trên cùng có dòng tài khoản kiểu story (avatar + `tienvahuyen` + `23.01.27`, `.acct`) và thanh tiến trình mảnh, cả hai đứng yên (`.hud`). Không thêm sticker hay thẻ nghiêng (ngoài nhãn mention trên ảnh bìa). Hình vẽ nằm trên ảnh dùng nét trắng (class `w`).
- **Hình vẽ tay** (cô dâu thích, theo mẫu "Save the date"): chỉ qua `Doodle.astro` + `doodles.ts`. Nét mực `--ink` mảnh, chi tiết nhỏ màu nhấn (`a:`), mép run bằng filter `#ink` (định nghĩa 1 lần trong `Story.astro`, gắn trên `<g>` trong SVG). 1–4 hình nhỏ mỗi màn, đặt ở lề hoặc cạnh tiêu đề, **không đè chữ hay ảnh** (kiểm ở 360/390/430), `pointer-events: none`. Người chỉ vẽ kiểu hình người tối giản không mặt, nét mực như các hình khác (`photo` trong timeline); không vẽ chân dung hay nét mặt. Tiêu đề serif giữ mép sắc, không filter.
- Chữ in hoa tiếng Việt `line-height ≥ 1.2`.
- Nút/vùng chạm ≥ 44px. Tương phản ≥ 4.5:1 (chữ ≥ 24px đậm: ≥ 3:1).
- Hiệu ứng nét vẽ tay theo PLAN §5: SVG `pathLength="1"` + `stroke-dashoffset`, `clip-path` cho chữ viết tay, `filter` cho ảnh bìa. Trạng thái "ẩn trước khi vẽ" **chỉ** áp dụng dưới `.js .scr:not(.in)` và trong `prefers-reduced-motion: no-preference` — không JS hoặc giảm chuyển động thì mọi thứ hiện sẵn. Class `js` gắn bằng script inline trong `<head>`; class `in` gắn bằng IntersectionObserver (threshold 0.45), mỗi màn chạy một lần.
- Hiệu ứng thông tin quan trọng (ngày, giờ, địa điểm, nút) **không bao giờ** bị ẩn chờ animation; chỉ phần trang trí được vẽ dần. Tổng thời gian vẽ mỗi màn ≤ 2.5s.
- Hiệu ứng phụ: `animation-timeline: view(inline)` (trục ngang), range `entry 0% entry 100%`, trong `@supports`. Thanh tiến trình story **tĩnh**, không tự chạy.
- Ảnh: `astro:assets` `<Picture formats={['avif','webp']}>`, có kích thước; màn 1 `fetchpriority="high"`, còn lại `loading="lazy"`.
- Tốc độ màn 1 (đã đo với ảnh nặng như ảnh film thật: bìa tràn màn LCP 1,7s, Lighthouse mobile):
  - Kích thước ảnh theo khung trong `img.ts` (`BG`, `DUMP`, `BOOTH`). Ảnh trong khung có tỉ lệ cố định qua `.ph` (`--ar`). Màn dùng `container-type: size`: kích thước ảnh tính theo `cqh` để vừa máy 360×640.
  - Mỗi `.scr` có `content-visibility: auto`: màn còn xa chưa vẽ nên ảnh trong đó chưa tải, nhường băng thông cho ảnh bìa. JS tải trước ảnh của màn kế tiếp (màn 2: sau khi ảnh bìa tải xong) để vuốt ngang không thấy ảnh hiện chậm.
  - Font viết tay chỉ tải khi `<html>` có class `fr` (JS gắn sau khi ảnh bìa tải xong, tối đa 2.5s).
  - Ảnh bìa có bản mờ 24px base64 làm nền (`Cover.astro`, dùng `sharp` có sẵn của Astro). Ảnh này quá nhỏ nên Chrome không tính là LCP.
- Tokens trong `src/styles/tokens.css` (PLAN §5). Câu chữ cố định trong `src/config/wedding.ts`; không tự viết lại.

## Cấu trúc
```
src/
  config/wedding.ts       # tên cặp đôi, ngày, âm lịch (hardcode), venue, giờ, song thân, YouTube ID, STK (ô TODO)
  config/xungho.ts        # 8 preset: ban, anh, chi, anhchi, em, co, chu, thay → { goi, minh, le }
  lib/guests.ts           # fetch Apps Script lúc build → validate → NFC → handle; không env → fixtures
  lib/copy.ts             # MỌI câu chữ phụ thuộc xưng hô (mention, tiêu đề, câu hỏi, lời cảm ơn, og:title…)
  lib/calendar.ts         # Google Calendar URL
  layouts/Base.astro      # head, OG, noindex, preload 1 font Cormorant Garamond, script gắn class js
  components/story/       # Story.astro (ghép màn + inline JS), Screen.astro (khung màn + vùng chạm; .hud nằm ở Story.astro),
                          # Cover, Countdown, Venue, PhotoDump, Rsvp, Farewell, Signature (SVG chữ ký), img.ts (widths/sizes)
  scripts/story.js        # JS duy nhất, inline qua ?raw: IntersectionObserver, chạm cạnh, đếm ngược, RSVP, beacon
  pages/index.astro       # bản chung (preset ban, 5 màn: không RSVP, không quà, không beacon)
  pages/k/[id].astro
  pages/404.astro
  styles/tokens.css       # @font-face tự viết + biến màu
  styles/story.css        # toàn bộ CSS (global, inline vào HTML lúc build)
  assets/photos/          # 01-cover, 02-countdown, 03-venue, 04-dump-1..3, 04-video, 05-rsvp, 06-booth-1..3 (.jpg); thay ảnh thật giữ nguyên tên
  assets/fonts/           # woff2 đã subset (scripts/subset-fonts.sh), Vite gắn hash
  assets/gift-qr.png      # QR chuyển khoản, chỉ vào build khi có khách showGift
public/  og.jpg  _headers  robots.txt
fixtures/guests.sample.json   # 6 khách: anh / ban (showGift) / co / anhchi / chu / thay
scripts/check-budget.mjs      # --strict: ô TODO trong wedding.ts thành lỗi
scripts/subset-fonts.sh  scripts/hw-chars.txt  scripts/signature.py
apps-script/api/              # web app Anyone: GET guests (token), POST rsvp/view
apps-script/admin/            # bound vào Sheet: menu Cập nhật khách từ tab "Khách …", Sinh guestID, Build lại thiệp
```
- Quà mừng dùng `<details>` (không JS); mở ra thì `:has()` ẩn dải photobooth. RSVP dùng radio + label, nút Gửi bật bằng JS.
- Câu viết tay (class `hw`) chỉ dùng ký tự trong `scripts/hw-chars.txt`; budget fail nếu lệch.

## Data contract
```ts
type XungHo = 'ban' | 'anh' | 'chi' | 'anhchi' | 'em' | 'co' | 'chu' | 'thay';
type Guest = {
  guestID: string;      // /^[a-z0-9-]{4,40}$/, unique → sai thì fail build
  ten: string;          // chỉ tên gọi: "Tuấn"
  xungHo: XungHo;       // trống/không hợp lệ → 'ban'
  diCung: string;       // "" | "người thương" | "gia đình"
  handle?: string;      // trống → tự sinh từ goi + ten ("anh.tuan"), ≤ 22 ký tự
  showGift: boolean;
};
```
Tab `Config` (key/giá trị) → `config: { sdtHoTro }`, chuẩn hoá về `0xxxxxxxxx`, trống thì ẩn dòng "Lạc đường?". Không hardcode số điện thoại trong code.
Host: Cloudflare Workers chỉ phục vụ file tĩnh (`wrangler.jsonc`, `assets.directory: ./dist`). Build variables (Workers Builds): `SHEET_API_URL`, `SHEET_TOKEN` (chỉ lúc build), `PUBLIC_API_URL` (POST RSVP/view). Không env → `fixtures/guests.sample.json` + `fixtures/config.sample.json`. RSVP/view gửi body JSON dạng **text/plain**.

## Lệnh
`npm run dev` · `npm run build` · `npm run preview` · `npm run budget` · Apps Script: `cd apps-script/<api|admin> && npx clasp push`; deploy lại bằng **Manage deployments → Edit → New version** (giữ URL).

## Quy trình
- Mỗi task: `npm run build && npm run budget`, xem `npm run preview` ở 360×640 và 390×844, với 3 khách mẫu `ban` / `anh` / `co`.
- Đụng route/config: `curl -sI <url>` phải 200, không `Location`.
- Thay đổi nhỏ, từng bước; vượt budget hoặc đi ngược luật cứng thì báo lại, không tự nới luật.
