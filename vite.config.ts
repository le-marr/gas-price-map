import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // Add this option to declare .xlsx and .geojson.gz files as assets
  assetsInclude: ['**/*.xlsx', '**/*.geojson.gz'],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
