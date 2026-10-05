import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

// `./server` and `./cli` run on Node against test databases, while `./client` renders pages and needs a DOM. Each
// set of tests runs in the environment its entry targets.
export default defineConfig({
  test: {
    projects: [
      createNodeVitestConfig({
        test: {
          name: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/client/**'],
        },
      }),
      createReactVitestConfig({
        test: {
          name: 'client',
          include: ['tests/client/**/*.test.{ts,tsx}'],
        },
      }),
    ],
  },
});
