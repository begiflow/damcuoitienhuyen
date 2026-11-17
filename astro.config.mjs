// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // og:image cần URL tuyệt đối. Đổi qua env SITE_URL khi chạy thử trên *.pages.dev.
  site: process.env.SITE_URL || 'https://tienvahuyen.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file', // /k/<id> → k/<id>.html, Pages trả 200 trực tiếp, không redirect thêm "/"
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
