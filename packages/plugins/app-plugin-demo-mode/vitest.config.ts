import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

// Tests are grouped by the source directory they cover. tests/client/ renders under jsdom, where page tests use
// renderWithApp() from @nocobase/app-testing/client; tests/server/, tests/database/ and tests/cli/ run under Node.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      createNodeVitestConfig({
        test: {
          name: 'node',
          include: ['tests/**/*.test.{ts,tsx}'],
          exclude: ['tests/client/**', 'tests/resources/**'],
        },
      }),
      createNodeVitestConfig({
        test: {
          name: 'resources',
          include: ['tests/resources/**/*.test.ts'],
          pool: 'forks',
          execArgv: ['--expose-gc', '--max-old-space-size=1536'],
          maxWorkers: 1,
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
