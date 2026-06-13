import { defineConfig } from 'vite';

export default defineConfig({
  // Setting base to relative path makes it easier to deploy to GitHub Pages without extra config
  base: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false
  }
});
