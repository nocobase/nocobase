import { realpathSync } from 'node:fs';

import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

// The verifier links installed workspace dependencies into an isolated temporary copy.
const server = {
  fs: {
    allow: [
      process.cwd(),
      searchForWorkspaceRoot(realpathSync('./node_modules')),
    ],
  },
};

export default defineConfig({
  cacheDir: './storage/tests/vite',
  server,
  test: {
    passWithNoTests: false,
    fileParallelism: false,
    projects: [
      createNodeVitestConfig({
        test: { name: 'node', include: ['tests/**/*.test.ts'] },
      }),
      createReactVitestConfig({
        server,
        test: { name: 'client', include: ['tests/client/**/*.test.tsx'] },
      }),
    ],
  },
});
