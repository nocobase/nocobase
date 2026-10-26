import { fileURLToPath } from 'node:url';

import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    root,
    projects: [
      createNodeVitestConfig({
        test: {
          root,
          name: 'node',
          include: ['tests/{server,database,cli,project}/**/*.test.{ts,tsx}'],
          // Database fixtures and command output capture run one file at a time.
          fileParallelism: false,
        },
      }),
      createReactVitestConfig({
        test: {
          root,
          name: 'client',
          environment: './tests/setup/application-environment.ts',
          // Client integration tests also start isolated application databases.
          fileParallelism: false,
          include: ['tests/client/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup/client-config.ts'],
          server: {
            deps: {
              // Keep the fixture, application and plugin clients in the same React/router context.
              // Server and shared modules stay external to preserve their service identities.
              inline: [
                /@nocobase\/app-testing\/(?:dist\/)?src\/client\//u,
                /@nocobase\/app-client\//u,
                /@[^/]+\/app-plugin-[^/]+\/(?:dist\/)?client\//u,
              ],
            },
          },
        },
      }),
    ],
    // Only the directories above contain Vitest suites. Playwright has its own runner.
    // Keep the command usable if an application intentionally removes all scaffold tests.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
});
