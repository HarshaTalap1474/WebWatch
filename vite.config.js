import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Setting base to relative path makes it easier to deploy to GitHub Pages without extra config
  base: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        todo: resolve(__dirname, 'todo.html')
      }
    }
  },
  server: {
    host: true, // Listen on all IPs
    open: false // explicitly prevent opening browser
  },
  preview: {
    host: true, // Listen on all IPs
    open: false,
    port: 8080
  }
});
