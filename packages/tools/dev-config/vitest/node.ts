import type { ViteUserConfig } from 'vitest/config';
import { mergeConfig } from 'vitest/config';

import { sharedHookTimeout, sharedTestTimeout } from './timeouts.js';

const nodeConfig: ViteUserConfig = {
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    testTimeout: sharedTestTimeout,
    hookTimeout: sharedHookTimeout,
  },
};

export const createNodeVitestConfig: (
  localConfig?: ViteUserConfig,
) => ViteUserConfig = (localConfig = {}) =>
  mergeConfig(nodeConfig, localConfig);
