// Kích thước ảnh dùng chung. Ảnh tràn màn: hiển thị ~390–480 CSS px ngang, cao 640–760.
export const FULL = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [480, 720, 1080],
  sizes: '(max-width: 480px) 100vw, 480px',
  quality: 60,
};
export const DUMP = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [320, 560],
  sizes: '(max-width: 480px) 55vw, 260px',
  quality: 60,
};
export const BOOTH = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [200],
  sizes: '100px',
  quality: 60,
};
