// Kích thước ảnh dùng chung. Ảnh luôn nằm trong khung polaroid, không tràn màn.
export const DUMP = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [320, 480],
  sizes: '(max-width: 480px) 42vw, 160px',
  quality: 60,
};
export const BOOTH = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [200],
  sizes: '100px',
  quality: 60,
};

// Ảnh bìa trong khung polaroid: rộng ~72% màn (≤ 300px)
export const COVER = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [400, 560, 800],
  sizes: '(max-width: 480px) 72vw, 300px',
  quality: 55,
};
// Ảnh nhỏ trong khung (địa điểm): rộng ~64% màn (≤ 260px)
export const SMALL = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [360, 560, 720],
  sizes: '(max-width: 480px) 64vw, 260px',
  quality: 55,
};
