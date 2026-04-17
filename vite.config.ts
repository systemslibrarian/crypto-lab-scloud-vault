import { defineConfig } from 'vite';

export default defineConfig({
  base: '/crypto-lab-scloud-vault/',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
