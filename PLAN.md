# PLAN — Thiệp cưới online · Tiệc cưới Thứ Bảy 23/01/2027

> Cập nhật 16/11/2026: chốt thiết kế **Story** (6 màn kiểu story mạng xã hội) và xưng hô cấu hình bằng cột `xungHo` trong Sheet.
> Cập nhật 17/11/2026: đã có code M1 + phần site của M2 + Apps Script `api` và menu admin (Sinh guestID, Build lại). Ảnh, og.jpg, QR đang là ảnh giả.
> Nguyên tắc: **load nhanh nhất > đẹp > nhiều tính năng.** Cái gì không có trong plan này thì không làm.

---

## 0. Quyết định đã chốt

| Hạng mục | Chốt | Ghi chú |
|---|---|---|
| Sự kiện | 1 tiệc chung · **Hidden Haven**, 393/12 Bình Quới, TP.HCM | 16:00 teabreak · 17:00 chụp ảnh lưu niệm cùng cô dâu chú rể · 18:00 lễ thành hôn, khai tiệc |
| Đối tượng thiệp online | Chủ yếu bạn bè, đồng nghiệp | Người lớn tuổi nhận thiệp giấy in ngoài |
| Thiết kế | **Story**: 6 màn trượt ngang, vuốt hoặc chạm cạnh để chuyển · màu **đỏ rượu + kem** | Mockup: canvas "Thiệp cưới online – bản trẻ trung", artboard 1 |
| Stack | **Astro static + CSS thuần**, 0 framework runtime | Output = HTML tĩnh |
| Host | Cloudflare **Workers (static assets)** + **domain tên 2 bạn** (.com) | Cloudflare khuyên dự án mới dùng Workers thay Pages; Workers Builds có deploy hook. Cấu hình: `wrangler.jsonc` |
| Nguồn dữ liệu | **Google Sheet duy nhất**, đọc **lúc build** | Lúc khách mở thiệp **không** gọi Sheet |
| Link khách | `https://<domain>/k/<guestID>` | guestID = slug tên + 4 ký tự ngẫu nhiên. **Không** đưa tên/xưng hô lên query param |
| Xưng hô | Cột `xungHo` (danh sách chọn sẵn, 8 giá trị) | Quyết định toàn bộ đại từ trên thiệp và tin nhắn Zalo, xem §2.1 |
| OG preview | 1 ảnh chung + og:title cá nhân hoá | "Gửi anh Tuấn · Tiên & Huyền cưới rồi!" |
| Mừng cưới | QR ẩn sau nút, chỉ khi `showGift = TRUE` | Khách khác: QR không có trong HTML |
| Tính năng | Đếm ngược · photo dump + video (thumbnail mở YouTube) · theo dõi đã mở · chạm cạnh để chuyển màn · nhạc nền (thử tự phát sau 2s, nút nốt nhạc để tắt) | |

**Không làm:** sổ lời chúc, ảnh OG riêng từng khách, bản in, song ngữ, Zalo Mini App, lightbox, CMS, analytics, thư viện âm lịch.

---

## 1. Kiến trúc

```
            ┌──────────── Google Sheet ────────────┐
            │  Guests │ RSVP │ Views │ Templates   │
            └───▲──────────▲───────────────▲───────┘
   GET guests   │          │ POST rsvp/view│ google.script.run
   (lúc build)  │          │ (sau khi trang│
   ┌────────────┴───┐      │  đã hiện)     │
   │ Apps Script API│◄─────┘      ┌────────┴─────────────┐
   │ (Anyone)       │             │ Apps Script Admin    │
   └───────▲────────┘             │ (Only myself)        │
           │                      │ menu: Sinh guestID,  │
   ┌───────┴───────────────────┐  │ Build lại thiệp ─────┼──► Deploy hook
   │ Cloudflare Workers(Astro) │◄─┴──────────────────────┘
   └───────┬───────────────────┘
           ▼
   /k/<guestID>  → HTML tĩnh đã ghi sẵn tên + xưng hô, trả 200, không redirect
```

- Sửa tên/xưng hô trong Sheet → bấm **Build lại** → 1–2 phút sau thiệp cập nhật. Link cũ giữ nguyên.
- Hai project Apps Script riêng: `api` (Access: Anyone) và `admin` (bound vào Sheet, Access: Only myself).

---

## 2. Google Sheet

Hai file: **file danh sách cũ** (các tab "Khách …" mỗi người tự nhập, tab chi phí) và **file thiệp** (`Guests`, `TongHop`, `Config`). Menu admin "Cập nhật khách từ danh sách cũ" đồng bộ các tab "Khách …" sang `Guests` (đọc file cũ qua Script Property `NGUON_SHEET_ID`). `TongHop` viết lại bằng `COUNTIFS`.

### Tab `Guests`

| Cột | Ví dụ | Vào build? | Ghi chú |
|---|---|---|---|
| `guestID` | `tuan-x7k2` | ✅ | **Bất biến sau khi gửi.** Protected range |
| `ten` | Tuấn | ✅ | Chỉ tên gọi, không kèm danh xưng |
| `xungHo` | `anh` | ✅ | Dropdown: `ban` · `anh` · `chi` · `anhchi` · `em` · `co` · `chu` · `thay`. Trống = `ban` |
| `diCung` | người thương / gia đình / (trống) | ✅ | Hiện trên nhãn tag: "@anh.tuan & người thương" |
| `handle` | `anh.tuan` | ✅ | Tuỳ chọn. Trống = tự sinh từ xưng hô + tên. Tối đa ~22 ký tự |
| `showGift` | ☑ / ☐ | ✅ | **Checkbox** (Chèn → Hộp kiểm). Tick = hiện nút quà mừng ở màn 6 cho khách đó. Mặc định bỏ tick |
| `kenh` | online / giay | ❌ | Chỉ dòng `online` mới sinh guestID |
| `nguoiMoi`, `nhom`, `tenGoc` | Chú Rể · VulcanLabs - Android · "A Dũng" | ❌ | Tab gốc, ghi chú cũ, tên như danh sách cũ |
| `duKien`, `soDiCung` | Chắc chắn đi · 1 | ❌ | Tab `TongHop` đếm khách + bàn theo 2 cột này |
| `canXem` | đoán xưng hô theo tên | ❌ | Lý do cần xem lại; xem xong xoá ô |
| `sdt` | 090… | ❌ | Admin dùng (Zalo) |
| `daGui`, `views`, `lastSeen`, `rsvp`, `soNguoi`, `ghiChu` | | ❌ | Admin/API ghi |

### 2.1 Bộ xưng hô (`src/config/xungho.ts`)

| `xungHo` | Gọi khách | Tự xưng | Lễ (`ạ`) | Ví dụ |
|---|---|---|---|---|
| `ban` | bạn | tụi mình | – | "Bạn tới được không?" |
| `anh` | anh | tụi em | – | "HẸN GẶP ANH TỐI 23.01!" |
| `chi` | chị | tụi em | – | "Chị tới được không?" |
| `anhchi` | anh chị | tụi em | – | "Nhắn gì cho tụi em?" |
| `em` | em | anh chị | – | "ANH CHỊ CƯỚI RỒI!" |
| `co` | cô | tụi con | ✅ | "Cô tới được không ạ?" |
| `chu` | chú | tụi con | ✅ | "Hồi âm giúp tụi con ạ" |
| `thay` | thầy | tụi em | ✅ | "Thầy tới được không ạ?" |

Các chỗ đổi theo xưng hô: tiêu đề màn 1 ("TỤI MÌNH/TỤI EM… CƯỚI RỒI!"), dòng viết tay màn 1 + 2, tiêu đề + câu hỏi + hạn trả lời + nút + ô nhắn ở màn 5, tiêu đề + dòng viết tay + nút quà ở màn 6, lời cảm ơn sau khi gửi, og:title, tin nhắn Zalo. Preset có lễ (`co`, `chu`, `thay`) dùng câu chữ lịch sự, bỏ các câu đùa ("chốt kèo", "bụng đói").

### Tab `Config` (admin tự tạo khi mở Sheet)

| key | giá trị | Ghi chú |
|---|---|---|
| `sdtHoTro` | 0901234567 | Số của Mai (bạn cô dâu) ở màn 6. Ô định dạng chữ để giữ số 0 đầu. Trống = ẩn dòng "Lạc đường?". Sửa xong bấm **Build lại** |

Chỉ key nằm trong danh sách cho phép của API mới được đưa vào build. Số sai định dạng (không phải di động VN 10 số) → build fail.

### Tab log (chỉ append)
`RSVP`: `ts | guestID | attending | soNguoi | ghiChu` · `Views`: `ts | guestID` · `Templates`: `key | text`

### Sinh guestID (menu admin)
`slug(ten)` + `-` + 4 ký tự từ `abcdefghjkmnpqrstuvwxyz23456789`. **Chỉ điền ô trống**, kiểm tra trùng.

---

## 3. API contract (`apps-script/api`)

| Request | Ai gọi | Payload | Trả về | Quy tắc |
|---|---|---|---|---|
| `GET ?action=guests&token=…` | Build | — | `{ok, guests:[{guestID, ten, xungHo, diCung, handle, showGift}], config:{sdtHoTro}}` | Token trong Script Properties. **Không trả** `sdt`, `nhom` |
| `POST {action:"rsvp", guestID, attending, soNguoi, ghiChu}` | Màn 5 | text/plain | `{ok:true}` | Validate guestID; `ghiChu` ≤ 300; `soNguoi` 1–6; LockService |
| `POST {action:"view", guestID}` | sendBeacon | text/plain | — | Sau 2s; bỏ qua `?preview=1` / `localStorage.noTrack` |

Rate limit: CacheService ≤ 10 request/giờ/guestID/action.

---

## 4. Trang khách — 6 màn Story

Mỗi màn: cao `clamp(640px, 100svh, 760px)`, rộng bằng khung (≤ 480px); các màn xếp ngang trong 1 khung bo góc 14px trên nền tối (máy thấp hơn 672px: bỏ lề + bo góc để vừa khít). Như story: thanh tiến trình 6 đoạn (màn đã qua đầy; màn đang xem chạy đầy trong **15s** rồi tự sang màn sau, trừ màn hồi âm và màn cuối; giữ ngón tay / đang gõ / mở quà thì tạm dừng) và tên `tienvahuyen · 23.01.27` **đứng yên** ở trên cùng (dưới tên là dòng nhạc như story: "▶ Romantic Sunday · Car, the Garden"; nút nốt nhạc tắt/bật nhạc sát góc dưới phải; xem §5 Nhạc nền), chỉ các màn trượt bên dưới; chữ trắng trên ảnh/nền tím, mực trên màn giấy. Chạm 28% cạnh phải/trái = sang màn sau/trước (trượt mượt). Vuốt ngang sang đúng 1 màn (`scroll-snap-type: x mandatory` + `scroll-snap-stop: always`). Màn bìa có mũi tên › trắng nhún nhẹ ở mép phải (gợi ý vuốt/chạm sang màn sau), không có chữ.

| # | Màn | Nội dung | Chức năng |
|---|---|---|---|
| 1 | Bìa | Kicker "THIỆP MỜI CƯỚI · 23.01.2027" · ảnh bìa trong khung polaroid + nhãn "@{handle} & {diCung}" · tên "TIÊN & HUYỀN" in hoa serif (dấu & cùng font) · "{TỤI EM} CƯỚI RỒI!" · dòng viết tay · mũi tên › trắng nhún nhẹ ở mép phải | Ảnh duy nhất tải ngay |
| 2 | Đếm ngược | Kicker "TIỆC CƯỚI TIÊN & HUYỀN" · 4 số ngày/giờ/phút/giây gọn trong vòng vẽ tay nhỏ (số màu mực, chỉ là phụ) · **điểm nhấn**: "Thứ Bảy" + **23.01.2027** to tím · **18:00** tím · *Hidden Haven* thư pháp · "nhằm 16 tháng Chạp năm Bính Ngọ" · **Dress code** gọn 1 dòng: chấm màu nhỏ kèm tên (Tím · Đỏ · Đen · Xanh lá, trong `wedding.ts`) · tờ giấy thấp để lộ mặt cô dâu chú rể trên ảnh nền | Nút viền **NHẮC MÌNH (LƯU VÀO LỊCH)** = Google Calendar link |
| 3 | Lịch trình & địa điểm | Kicker "THỨ BẢY · 23.01.2027" (không tiêu đề) · dòng thời gian zig-zag quanh trục giữa, mỗi mục 1 hình vẽ tay theo việc (khoanh giờ khai tiệc) · *Hidden Haven* thư pháp · địa chỉ (không ảnh địa điểm: timeline nhiều mục không vừa máy 360×640) | Nút viền **CHỈ ĐƯỜNG** (Google Maps) + "bấm vô đây" |
| 4 | Hồi âm (đặt trước ảnh cưới để khách tới sớm hơn) | Câu hỏi theo xưng hô · hạn 15/01 · 2 lựa chọn dạng nút bo tròn · "Số người tham dự" 1/2/3/4+ (mặc định 2 nếu có `diCung` hoặc dòng 2 người, 1 nếu không) · ô nhắn gạch chân, gợi ý "Lời chúc, dẫn bé theo…" | **Mặc định chưa chọn**; nút Gửi khoá tới khi chọn; gửi xong đổi "Đã gửi, cảm ơn {goi}!". Tiệc mặn, menu cố định: **không** gợi ý chọn món/ăn chay. (không có nút ghim tắt: hồi âm đã ở màn 4) |
| 5 | Ảnh cưới | Tiêu đề "Ảnh cưới" + hình máy ảnh (không dùng chữ "photo dump") · lưới 2×2 ảnh polaroid nghiêng nhẹ + băng keo; 1 ô "phim cưới" có nút ▶ | Ảnh video mở `youtu.be/<id>` (không iframe) |
| 6 | Kết | Nền đỏ rượu · "HẸN GẶP {GOI} TỐI 23.01!" · dải ảnh photobooth 3 khung nghiêng · nút viền quà mừng (chỉ `showGift`) + "hẹn chụp chung một tấm nha!" · song thân hai bên (nhà trai: Bà Phạm Thị Hoa · nhà gái: Bà Dương Thị Mỹ Dung) · "Lạc đường? Gọi Mai (bạn cô dâu): {sdtHoTro}" (số lấy từ tab Config) | QR chỉ tải khi mở (lúc đó ẩn dải ảnh). Dải ảnh tự co theo chỗ trống, tự ẩn khi còn < 150px (container query) |

- `/` = bản chung (xưng hô `ban`, không RSVP, không QR). `404`: hướng dẫn liên hệ.
- Ngày âm lịch hardcode, soát lịch vạn niên ở M4.
- og:title: `Gửi {goi} {ten} · Tiên & Huyền cưới rồi!` (preset `ban` chỉ ghi tên: "Gửi Linh · …") · og:description: `Thứ Bảy 23/01/2027 · {venue}` · og:image JPEG 1200×630 chung · `noindex` (meta + header), robots.txt không Disallow.

---

## 5. Design

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--accent` | `#4E3A7A` (tím oải hương đậm, cô dâu chọn) | Tiêu đề nhấn, giờ, nhãn mention, nền màn 6 (trắng trên nền này ≈ 9.5:1) |
| `--soft` | `#EAE3F5` (tím nhạt) | Nền màn xen kẽ (2, 4) |
| `--paper` | `#F6F3FA` (trắng ngà ánh tím) | Nền chính |
| `--ink` | `#241F2E` (mực tím than) | Chữ, nét vẽ tay, nút viền |
| `--muted` | `#645C73` | Chữ phụ (≥ 5:1 trên paper và soft) |
| `--bg` | `#1B1822` | Nền giữa các màn |

- **Font** (đổi 25/11 theo thiệp mẫu cô dâu chọn): **Cormorant Garamond 500–700** (serif thanh đậm, 1 file variable ~30KB, số thẳng hàng) cho mọi chữ, kể cả tên cô dâu chú rể in hoa; **Great Vibes** (thư pháp) cho câu viết tay, tên nhà hàng, chữ "Nhà trai/Nhà gái", **subset đúng các ký tự đang dùng** (~17KB). Dòng tài khoản + nhãn mention dùng chữ hệ thống.
- **Chữ in hoa tiếng Việt:** `line-height ≥ 1.2` (dưới mức này dấu nặng dòng trên đè dấu sắc dòng dưới).
- **Chữ trên ảnh:** luôn có lớp phủ tối (trên 130px, dưới 30–58%) + `text-shadow` cho chữ viết tay.
- **Nhãn kiểu story:** chữ hệ thống đậm trên nền tím, `box-decoration-break: clone`.
- **Hiệu ứng nét vẽ tay ("art")** — chạy khi màn vào khung nhìn, mỗi màn một lần:
  | Màn | Hiệu ứng |
  |---|---|
  | 1 | Ảnh bìa hiện dần như tráng phim (mờ → rõ) · tên "TIÊN & HUYỀN" in hoa serif đầy · ngôi sao lấp lánh vẽ tay · dòng chữ viết tay hiện như mực chảy |
  | 2 | Gạch chân nguệch ngoạc dưới tiêu đề · vòng bút khoanh số ngày |
  | 3 | Vòng bút khoanh giờ làm lễ & khai tiệc (18:00) · mũi tên tự vẽ tới nút Chỉ đường |
  | 4 | Chữ "photo dump" tự viết · tim + sao vẽ tay quanh ảnh |
  | 5 | Gạch chân dưới tiêu đề · dấu tick tự vẽ khi bấm Gửi |
  | 6 | Hai chiếc nhẫn vẽ nét · mũi tên tới dải photobooth · chữ viết tay hiện dần |
- **Hình vẽ tay kiểu "Save the date"** (`doodles.ts`, vẽ dần như trên): bìa: ly martini, cành lá, sao · màn 2: quả cầu disco treo, sao · màn 3: mỗi mục lịch trình 1 hình (2 ly cocktail + kệ bánh; cổng hoa, cô dâu chú rể, khách, máy ảnh; bàn tiệc tròn + nốt nhạc) · màn 4: máy ảnh cạnh "photo dump" · màn 5: phong bì · màn 6: bó hoa, sao. Mép nét run bằng 1 filter SVG dùng chung, không tải thêm file.
- **Kỹ thuật:** SVG `pathLength="1"` + `stroke-dashoffset` (nét vẽ), `clip-path` (chữ viết tay), `filter` (tráng phim). Tên trên bìa = chữ in hoa Cormorant ("TIÊN & HUYỀN"), không cần font thư pháp (~4KB gzip, không cần tải font cho tên). Thẻ `<html>` nhận class `js` bằng script inline trong `<head>` (tránh nháy); IntersectionObserver gắn class `in` cho màn đã thấy (≥45%). Không JS → mọi thứ hiện sẵn, không ẩn gì. `prefers-reduced-motion` → tắt hết, nội dung hiện đầy đủ.
- **Hiệu ứng phụ:** nhãn bật lên, ảnh thả rơi bằng CSS scroll-driven (`animation-timeline: view()`, range `entry 0% entry 100%`), trong `@supports`.
- **Nhạc nền** (thêm 26/11, đổi sang tự phát theo yêu cầu): đoạn đầu "Romantic Sunday" (Car, the Garden), 73s, lặp liền. **2s sau khi mở** thiệp tải nhạc và thử phát; trình duyệt chặn tự phát (Chrome, Safari, đa số webview) thì nhạc bật ở **lần chạm đầu tiên** bất kỳ đâu (chạm cạnh sang màn, chạm nút…). Tắt/bật: nút nốt nhạc sát góc dưới phải (nốt nhạc = đang phát, có gạch chéo = tắt) hoặc chạm dòng "▶ Romantic Sunday · Car, the Garden" dưới tên tài khoản (đang phát: 3 vạch sóng). Đang tải: biểu tượng nhấp nháy. Rời trang/sang app khác tự dừng, quay lại phát tiếp nếu khách chưa tắt. Tải cả file thành blob rồi phát bằng `<audio>` (host tĩnh Cloudflare không trả 206 cho Range nên iPhone không phát thẳng từ URL; Web Audio thì phải giải mã cả bài, làm khựng máy và tụt Lighthouse). File: Opus 32kbps `.webm` (~312KB) + AAC 64kbps `.m4a` cho máy không phát được Opus (~590KB, iPhone đời cũ), đã chuẩn hoá −14 LUFS, lên/xuống âm lượng dần ở hai đầu. Mọi khách tốn thêm ~312KB dữ liệu (tải sau khi trang đã hiện, không ảnh hưởng LCP).

---

## 6. Performance budget (fail build nếu vượt)

| Tài nguyên | Ngân sách |
|---|---|
| HTML trang khách (CSS + JS inline) | ≤ 30KB gzip |
| Font tải lần đầu | ≤ 80KB (Cormorant Garamond 500–700 ≈ 30KB; Great Vibes 16KB tải sau ảnh bìa) |
| Ảnh màn 1 (eager, `fetchpriority=high`) | ≤ 150KB AVIF |
| Ảnh màn 2–6 + photo dump (lazy) | ≤ 800KB tổng |
| JS | ≤ 5KB, vanilla (đếm ngược, chạm cạnh, RSVP, quà, beacon, nhạc, IntersectionObserver cho hiệu ứng) |
| Nhạc (tải sau 2s, sau khi trang đã hiện) | Opus ≤ 400KB; bản AAC dự phòng ≤ 700KB chỉ máy không giải mã được Opus mới tải |
| Request bên thứ 3 trước khi trang hiển thị | **0** |
| Lighthouse mobile | Perf ≥ 95 · LCP ≤ 2.0s · CLS < 0.05 |

Cấu hình bắt buộc: `output: 'static'`, `build.format: 'file'`, `trailingSlash: 'never'`, `build.inlineStylesheets: 'always'`.

---

## 7. Admin (Apps Script `admin`)

- Thống kê: đã gửi / đã xem / RSVP có–không / tổng người / ước số bàn (÷10).
- Lọc: nhóm · chưa gửi · đã gửi chưa xem · đã xem chưa RSVP.
- Mỗi khách: **Copy tin mời** · **Copy tin nhắc** · **Mở Zalo** (`zalo.me/<sdt>`) · **Đã gửi ✓**.
- Menu Sheet: "Cập nhật khách từ danh sách cũ" · "Sinh guestID cho dòng trống" · "Build lại thiệp".
- **Cập nhật khách từ danh sách cũ**: các tab "Khách …" (mỗi người tự nhập) vẫn là nơi thêm khách. Nút này khớp dòng theo (người mời, ghi chú, tên): khách mới → thêm vào `Guests` (đoán tên gọi, xưng hô, đi cùng, kênh) rồi sinh guestID cho dòng online; khách cũ → chỉ cập nhật `nhom`, `duKien`, `soDiCung`; khách bị xoá ở tab gốc → giữ dòng, ghi vào `canXem`. Không bao giờ sửa `ten`, `xungHo`, `diCung`, `kenh`, `guestID` đã có. Đổi tên ở tab gốc = 1 dòng mới + dòng cũ bị đánh dấu → muốn sửa tên trên thiệp thì sửa cột `ten` trong `Guests`.
- Clipboard trong iframe HtmlService có thể bị chặn → fallback `execCommand('copy')`, test ở M3.

### Tin nhắn mẫu (tab `Templates`)
Placeholder lấy từ preset xưng hô: `{chao}` (= `ten` nếu `ban`, ngược lại `{Goi} {ten}`), `{goi}`, `{minh}`, `{tail}` (` nha` / ` ạ`).

**`moi`**
> {chao} ơi, {minh} cưới rồi nè! Tiệc cưới lúc {gio}, Thứ Bảy 23/01/2027 (16 tháng Chạp) tại {venue}, {diaChi}.
> Thiệp mời của {goi}: {link}
> (Link chỉ để xem thông tin và xác nhận, không cần đăng nhập hay cài gì.) Mong {goi} tới chung vui{tail}!

**`nhac`**
> {chao} ơi, còn {soNgay} ngày nữa là tiệc cưới của {minh} rồi. {Goi} xác nhận giúp {minh} để xếp chỗ{tail}: {link}

---

## 8. Milestones

| M | Thời gian | Việc | Done khi |
|---|---|---|---|
| **M0** Setup | 16–22/11 | Domain · Workers · repo Astro · import Excel → Sheet · cột `xungHo` dropdown · script sinh guestID | `curl -sI` trả 200; mọi khách `online` có guestID + xungHo |
| **M1** UI tĩnh | 23–29/11 | 6 màn Story theo mockup, fixtures 3 preset (`ban`, `anh`, `co`) · tokens · font subset · `check-budget` | Budget pass · đúng ở 360×640 và 390×844 · không lỗi dấu |
| **M2** Data | 30/11–06/12 | API · build fetch · `/k/[id]` · `xungho.ts` · RSVP · beacon · deploy hook | Đổi `xungHo` trong Sheet → Build lại → thiệp đổi đúng < 3 phút |
| **M3** Admin | 07–13/12 | Trang admin · Templates theo preset · thống kê | Gửi thử 3 khách trên điện thoại < 30s/khách |
| **M4** Content | 14–20/12 | Ảnh thật · og.jpg · video · venue/giờ · soát âm lịch | **Content freeze 20/12** |
| **M5** QA | 21–27/12 | Test matrix §9 · gửi thử 5–10 bạn thân | Không lỗi trên Zalo iOS/Android |
| **Launch** | 02–06/01 | Đăng thông báo cá nhân → gửi đợt chính · 15/01 hạn RSVP · 19–20/01 nhắc | |

---

## 9. Test matrix (M5)

| Môi trường / ca | Kiểm tra |
|---|---|
| Zalo in-app iPhone + Android cũ, Messenger | Load 4G, dấu tiếng Việt, chạm cạnh chuyển màn, cuộn snap, RSVP, Chỉ đường, Google Calendar |
| 360×640 (máy nhỏ) | Không màn nào bị cắt nút Gửi / dòng song thân |
| 3 preset `ban`, `anh`, `co` | Đúng đại từ ở cả 6 màn + og:title + tin nhắn Zalo |
| Zalo Sharing Debugger | Preview đúng với guestID test (không dùng link khách thật) |
| `curl -sI /k/test-xxxx` | 200, không `Location` |
| View-source khách `showGift=FALSE` | Không có QR/STK |
| `prefers-reduced-motion` | Không animation, nội dung vẫn hiện đủ |

---

## 10. Rủi ro đã biết

| Rủi ro | Xử lý |
|---|---|
| Host redirect thêm "/" → Zalo không lấy preview | `build.format:'file'` + `trailingSlash:'never'` + `html_handling: auto-trailing-slash` (đã thử: `/k/<id>` trả 200, không `Location`) + curl |
| Zalo cache preview cũ | Chốt og.jpg trước 20/12; test bằng guestID test |
| Đổi/sinh lại guestID → link chết | Script chỉ điền ô trống + Protected range |
| Tên lẫn NFC/NFD | `.normalize('NFC')` khi build |
| **Fontsource Playwrite VN khai báo `unicode-range` thiếu tiếng Việt** → chữ có dấu rơi sang font khác dù file có đủ glyph | Tự viết `@font-face` không có `unicode-range`, hoặc subset bằng `pyftsubset` |
| Chữ in hoa có dấu bị đè dòng | `line-height ≥ 1.2` cho mọi tiêu đề in hoa |
| Khách lướt qua bị tính "Tới" | RSVP mặc định chưa chọn |
| `handle` quá dài vỡ nhãn tag | Giới hạn ~22 ký tự; nhãn cho phép xuống dòng |
| Scroll-driven animation không hỗ trợ (iOS < 26) | Chỉ là trang trí; nội dung luôn hiện |
| Apps Script chậm 1–3s | Chỉ gọi khi bấm Gửi / beacon ngầm |
| Khách nghi link lừa đảo | Domain tên 2 bạn · tin nhắn tự đủ thông tin · Zalo chính chủ · bật 2FA |
