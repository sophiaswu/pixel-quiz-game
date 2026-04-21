import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/pixel-quiz-game/', // 確保在 GitHub Pages (子路徑) 下能正確載入資源
});
