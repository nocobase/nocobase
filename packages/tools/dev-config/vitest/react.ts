import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';
import { mergeConfig } from 'vitest/config';

import { sharedHookTimeout, sharedTestTimeout } from './timeouts.js';

const reactSetupFile: string = fileURLToPath(
  new URL('./react-setup.js', import.meta.url),
);
const reactConfig: ViteUserConfig = {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    setupFiles: [reactSetupFile],
    testTimeout: sharedTestTimeout,
    hookTimeout: sharedHookTimeout,
    server: {
      deps: {
        // Refine's React Router bindings are loaded by Node unless inlined, and Node hands them a different copy of
        // react-router than the one a test and the application import, so `useLocation()` inside Refine finds no
        // router under a test's `MemoryRouter`. Inlined, they resolve react-router the way the rest of the test does.
        inline: [/@refinedev\/react-router/u],
      },
    },
  },
};

export const createReactVitestConfig: (
  localConfig?: ViteUserConfig,
) => ViteUserConfig = (localConfig = {}) =>
  mergeConfig(reactConfig, localConfig);
