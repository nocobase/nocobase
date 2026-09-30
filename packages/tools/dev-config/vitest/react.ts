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
  },
};

export const createReactVitestConfig: (
  localConfig?: ViteUserConfig,
) => ViteUserConfig = (localConfig = {}) =>
  mergeConfig(reactConfig, localConfig);
