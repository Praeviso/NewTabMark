import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { mkdir, copyFile } from 'node:fs/promises';

function copyLegacyAssets() {
  const legacySourceFiles = [
    'src/theme-init.js',
    'src/lodash.min.js',
    'src/Sortable.min.js',
    'src/qrcode.min.js'
  ];

  return {
    name: 'copy-legacy-assets',
    apply: 'build',
    async closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      const legacyDir = resolve(outDir, 'legacy');
      await mkdir(legacyDir, { recursive: true });

      await Promise.all(
        legacySourceFiles.map(async (file) => {
          const from = resolve(__dirname, file);
          const to = resolve(legacyDir, file.split('/').pop());
          await copyFile(from, to);
        })
      );
    }
  };
}

function stripTailwindDirectivesFromLegacyStyles() {
  return {
    name: 'strip-tailwind-directives-from-legacy-styles',
    enforce: 'pre',
    transform(code, id) {
      const filePath = id.split('?')[0];
      if (!filePath.endsWith(`${resolve(__dirname, 'src', 'styles.css')}`)) return null;
      if (!code.includes('@tailwind')) return null;
      const stripped = code
        .replace(/^\s*@tailwind\s+base\s*;\s*$/gm, '')
        .replace(/^\s*@tailwind\s+components\s*;\s*$/gm, '')
        .replace(/^\s*@tailwind\s+utilities\s*;\s*$/gm, '');
      return { code: stripped, map: null };
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), stripTailwindDirectivesFromLegacyStyles(), copyLegacyAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'newtab.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/style.css';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
