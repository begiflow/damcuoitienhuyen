#!/usr/bin/env bash
# Subset font tự host vào src/assets/fonts (Vite gắn hash vào tên file khi build). Chỉ chạy lại khi đổi font.
# Cần: pip install fonttools brotli
# Nguồn: github.com/google/fonts (ofl/cormorantgaramond, ofl/greatvibes), tải vào $1 (mặc định .fonts-src/)
set -euo pipefail
SRC="${1:-.fonts-src}"
OUT="src/assets/fonts"
mkdir -p "$OUT"
# ASCII + Latin-1 có dấu tiếng Việt + Ă Đ Ĩ Ũ Ơ Ư + khối Vietnamese + dấu câu hay dùng
U="U+0020-007E,U+00A0,U+00B7,U+00C0-00C3,U+00C8-00CA,U+00CC-00CD,U+00D2-00D5,U+00D9-00DA,U+00DD,U+00E0-00E3,U+00E8-00EA,U+00EC-00ED,U+00F2-00F5,U+00F9-00FA,U+00FD,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303,U+0309,U+0323,U+1EA0-1EF9,U+2013-2014,U+2018-2019,U+201C-201D,U+2026,U+20AB"
# Cormorant Garamond là variable font: giữ trục wght 500–700 (1 file cho chữ thường 500, nút 600, tiêu đề 700).
# Giữ lnum: số thẳng hàng như thiệp mẫu (mặc định font dùng số kiểu cũ).
fonttools varLib.instancer "$SRC/CormorantGaramond[wght].ttf" wght=500:700 -o "$SRC/CormorantGaramond-500-700.ttf" -q
pyftsubset "$SRC/CormorantGaramond-500-700.ttf" --unicodes="$U" --flavor=woff2 --layout-features='kern,liga,lnum,tnum,ccmp,mark,mkmk' --no-hinting --desubroutinize --output-file="$OUT/cormorant-500-700.woff2"
# Chữ viết tay (Great Vibes) chỉ dùng chữ thường → subset theo scripts/hw-chars.txt.
# npm run budget sẽ báo nếu câu viết tay dùng ký tự ngoài file này.
pyftsubset "$SRC/GreatVibes-Regular.ttf" --text-file=scripts/hw-chars.txt --flavor=woff2 --layout-features='*' --no-hinting --desubroutinize --output-file="$OUT/greatvibes-400.woff2"
# Dấu & thư pháp giữa tên trên bìa: outline SVG, không tải font
python3 scripts/signature.py "$SRC/GreatVibes-Regular.ttf" > src/components/story/Amp.astro
ls -l "$OUT"
