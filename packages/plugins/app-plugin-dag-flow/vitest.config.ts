import { fileURLToPath } from 'node:url';

import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  resolve: {
    alias: [
      {
        // Exact, so subpaths such as `@nocobase/db/testing` resolve normally
        // instead of being appended to this file's path.
        find: /^@nocobase\/db$/,
        replacement: fileURLToPath(
          new URL('../../libs/db/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    testTimeout: 30_000,
  },
});
