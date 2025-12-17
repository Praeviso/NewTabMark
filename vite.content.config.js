import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content.js'),
      formats: ['iife'],
      name: 'NewTabMarkContent'
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js'
      }
    }
  }
});

