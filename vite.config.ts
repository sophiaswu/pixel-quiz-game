import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/pixel-quiz-game/', // 確保使用相對路徑，這樣不論 GitHub Pages 子網址長怎樣都能抓到資源
});
