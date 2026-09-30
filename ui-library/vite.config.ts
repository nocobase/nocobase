import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss() as unknown as PluginOption],
  resolve: {
    alias: [
      {
        find: '@nocobase/app-plugin-authentication/client/actions',
        replacement: path.resolve(
          __dirname,
          './website/demo/auth/auth-ui/mock-actions.tsx',
        ),
      },
      {
        // Exact, so that `client/actions` above keeps its own stand-in.
        find: /^@nocobase\/app-plugin-authentication\/client$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/auth/auth-ui/mock-client.ts',
        ),
      },
      { find: '@', replacement: path.resolve(__dirname, './website') },
    ],
  },
});
