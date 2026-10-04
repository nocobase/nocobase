import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss() as unknown as PluginOption],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './website') }],
  },
});
