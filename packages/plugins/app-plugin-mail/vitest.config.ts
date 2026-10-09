import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      createNodeVitestConfig({
        test: {
          name: 'server',
          include: ['tests/{server,database,project}/**/*.test.ts'],
        },
      }),
      createReactVitestConfig({
        test: {
          name: 'client',
          include: ['tests/client/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/helpers/client-config.ts'],
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: [
        'client/**/*.{ts,tsx}',
        'server/**/*.ts',
        'shared/**/*.ts',
        'database/**/*.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 79, statements: 76, functions: 78, branches: 68 },
    },
  },
});
