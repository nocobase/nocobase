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
  // Match native Node 24 package exports instead of selecting a separate module entry.
  resolve: { conditions: ['node', 'module-sync'] },
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    setupFiles: [reactSetupFile],
    testTimeout: sharedTestTimeout,
    hookTimeout: sharedHookTimeout,
    server: {
      deps: {
        // Router contexts must keep one identity across installed runtime and test helpers.
        external: [/react-router(?:\/|$)/u],
      },
    },
  },
};

export const createReactVitestConfig: (
  localConfig?: ViteUserConfig,
) => ViteUserConfig = (localConfig = {}) =>
  mergeConfig(reactConfig, localConfig);
