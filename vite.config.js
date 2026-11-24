import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'lucide-react'],
          'data-chuong1': ['./src/data/chuong1.json'],
          'data-chuong2': ['./src/data/chuong2.json'],
          'data-chuong3': ['./src/data/chuong3.json'],
        },
      },
    },
  },
});
