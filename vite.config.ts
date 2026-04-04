import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/gas-price-map/', // Set the base path for GitHub Pages
  // declare .xlsx and .geojson.gz files as assets to be included
  assetsInclude: ['**/*.xlsx', '**/*.geojson.gz'],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
