import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background.js'),
      formats: ['iife'],
      name: 'NewTabMarkBackground'
    },
    rollupOptions: {
      output: {
        entryFileNames: 'background.js'
      }
    }
  }
});

