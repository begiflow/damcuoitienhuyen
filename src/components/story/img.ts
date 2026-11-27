// Kích thước ảnh dùng chung. Ảnh luôn nằm trong khung polaroid, không tràn màn.
export const DUMP = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [320, 480],
  sizes: '(max-width: 480px) 42vw, 160px',
  quality: 60,
};
// Ảnh nền tràn màn (màn 1, 2, 3, 5): rộng 100% màn ≤ 480px. Fallback webp cho nhẹ (mọi trình duyệt hiện nay đều đọc được).
export const BG = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  fallbackFormat: 'webp' as const,
  // 760 chứ không 720: máy giả lập Lighthouse cần 412 × 1.75 = 721px, lệch 1px là nhảy lên bản 960
  widths: [480, 760, 960],
  sizes: '(max-width: 480px) 100vw, 480px',
  quality: 50,
};
export const BOOTH = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [200],
  sizes: '100px',
  quality: 60,
};
// Ảnh cưới xem lớn (bấm ảnh nhỏ ở màn ảnh cưới): ~94% bề ngang máy, tối đa 760px để nhẹ
export const ZOOM = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  fallbackFormat: 'webp' as const,
  widths: [480, 760],
  sizes: '(max-width: 480px) 94vw, 450px',
  quality: 50,
};
