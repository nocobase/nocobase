import { fileURLToPath } from 'node:url';

import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  resolve: {
    alias: {
      '@nocobase/db': fileURLToPath(
        new URL('../../libs/db/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    testTimeout: 30_000,
  },
});
