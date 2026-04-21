import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/pixel-quiz-game/', // 確保使用正確的 repository 名稱作為基底路徑
});
