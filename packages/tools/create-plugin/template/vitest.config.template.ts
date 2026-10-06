import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

// Page tests in tests/client/ render under jsdom with renderWithApp() from @nocobase/app-testing/client; every other
// test runs under Node.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      createNodeVitestConfig({
        test: {
          name: 'node',
          include: ['tests/**/*.test.{ts,tsx}'],
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
