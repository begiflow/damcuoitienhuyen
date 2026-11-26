"""Xuất chữ "and" thư pháp (Great Vibes) giữa TIÊN and HUYỀN thành SVG outline cho Amp.astro: bìa không phải tải font viết tay.
Như thiệp mẫu: tên cô dâu chú rể in hoa serif, chỉ chữ nối là thư pháp.
Cần: pip install fonttools uharfbuzz · Chạy: python3 scripts/signature.py .fonts-src/GreatVibes-Regular.ttf > src/components/story/Amp.astro"""
import sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

TEXT, STEP = 'and', 0.16
path = sys.argv[1]
font = TTFont(path)
gs = font.getGlyphSet()
blob = hb.Blob.from_file_path(path)
hbf = hb.Font(hb.Face(blob))
buf = hb.Buffer()
buf.add_str(TEXT)
buf.guess_segment_properties()
hb.shape(hbf, buf, {'kern': True, 'liga': True, 'calt': True})

x, paths, box = 0, [], [1e9, 1e9, -1e9, -1e9]
order = font.getGlyphOrder()
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    dx, dy = x + pos.x_offset, pos.y_offset
    x += pos.x_advance
    pen = SVGPathPen(gs, lambda v: str(round(v)))
    gs[name].draw(TransformPen(pen, (1, 0, 0, -1, dx, -dy)))  # lật trục y cho SVG
    d = pen.getCommands()
    if not d:
        continue  # dấu cách
    bp = BoundsPen(gs)
    gs[name].draw(TransformPen(bp, (1, 0, 0, -1, dx, -dy)))
    if bp.bounds:
        b = bp.bounds
        box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
    paths.append(d)

pad = 30
# đáy viewBox = đường chân chữ (y=0) để CSS căn baseline với tên in hoa; nét đuôi dưới chân chữ vẫn hiện (overflow: visible)
vb = f'{round(box[0] - pad)} {round(box[1] - pad)} {round(box[2] - box[0] + 2 * pad)} {round(-(box[1] - pad))}'
print('---\n// Chữ "and" thư pháp giữa tên cô dâu chú rể (như thiệp mẫu): outline Great Vibes xuất sẵn bằng scripts/signature.py.')
print(f'// Mỗi chữ vẽ nét rồi tô đầy, lệch nhau {STEP}s.\n---')
body = ''.join(f'<path pathLength="1" d="{d}" style="animation-delay:{round(i * STEP, 2)}s, {round(i * STEP + 0.62, 2)}s"></path>' for i, d in enumerate(paths))
print(f'<svg class="amp" viewBox="{vb}" role="img" aria-label="và">{body}</svg>')
