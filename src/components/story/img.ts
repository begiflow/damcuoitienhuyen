// Kích thước ảnh dùng chung. Ảnh tràn màn: hiển thị ~390–480 CSS px ngang, cao 640–760.
// 800w cho máy 412px DPR 1.75 (= 721px, PageSpeed giả lập máy này): có 720w thì trình duyệt nhảy lên 1080w.
// quality 50: ảnh nền nằm dưới lớp phủ tối, khác biệt với 60 khó thấy nhưng nhẹ hơn 2–3 lần với ảnh có hạt film.
export const FULL = {
  formats: ['avif', 'webp'] as Array<'avif' | 'webp'>,
  widths: [640, 800, 1080],
  sizes: '(max-width: 480px) 100vw, 480px',
  quality: 50,
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
