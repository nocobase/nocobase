import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { defineConfig } from 'vitest/config';

// Tests are grouped by the source directory they cover: tests/server/, tests/database/ and tests/cli/ run under Node.
// Client code renders under jsdom, so a plugin that gains it adds a 'client' project for tests/client/, as a plugin
// generated with client capabilities has.
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
    ],
  },
});
