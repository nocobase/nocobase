import { fileURLToPath } from 'node:url';

import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

const root = fileURLToPath(new URL('.', import.meta.url));

export default createReactVitestConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./client', import.meta.url)),
      },
    ],
  },
  test: {
    root,
    server: {
      deps: {
        // Transform the public Client surfaces so vi.mock applies, without duplicating the Server packages' identity tokens.
        inline: [
          /@nocobase\/app-plugin-authorization\/(?:dist\/)?client\//u,
          /@nocobase\/app-plugin-notification-in-app\/(?:dist\/)?client\//u,
        ],
      },
    },
    // A glob rather than a list of filenames. The list had to be edited by hand for every test added or removed and
    // silently drifted: it named a file that no longer existed while several real test files were absent from it, so
    // those tests were never run at all.
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup/client-config.ts'],
    // Keep the command usable if an application intentionally removes all scaffold tests before adding its own.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
});
