// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // og:image (ảnh xem trước khi gửi link Zalo), og:url, link trong file lịch cần URL tuyệt đối.
  // Tên miền chính tienhuyen.online (mua 28/11); link workers.dev cũ vẫn chạy.
  site: process.env.SITE_URL || 'https://tienhuyen.online',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file', // /k/<id> → k/<id>.html, Workers trả 200 trực tiếp, không redirect thêm "/"
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
