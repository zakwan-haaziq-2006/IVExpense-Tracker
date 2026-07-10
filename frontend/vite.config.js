import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built bundle works wherever FastAPI serves it from.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: { '/api': 'http://localhost:8000' }, // dev: forward API to FastAPI
  },
});
