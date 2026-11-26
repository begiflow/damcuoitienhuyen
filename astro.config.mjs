// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // og:image (ảnh xem trước khi gửi link Zalo) cần URL tuyệt đối, đúng host đang chạy.
  // Chưa mua tên miền → mặc định workers.dev; mua rồi thì đặt env SITE_URL (hoặc đổi dòng này).
  site: process.env.SITE_URL || 'https://damcuoitienhuyen.chutien-it.workers.dev',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file', // /k/<id> → k/<id>.html, Workers trả 200 trực tiếp, không redirect thêm "/"
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
