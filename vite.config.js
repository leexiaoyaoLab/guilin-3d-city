import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const resolvedRoot = fs.realpathSync(configDir);

export default defineConfig({
  root: resolvedRoot,
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false
  },
  build: {
    outDir: path.join(resolvedRoot, 'dist'),
    emptyOutDir: true,
    target: 'esnext',
    chunkSizeWarningLimit: 900
  }
});
