import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

export default createReactVitestConfig({
  test: {
    // Existing server/runtime tests require Node semantics. Component tests can
    // opt into jsdom with Vitest's per-file environment annotation.
    environment: 'node',
    setupFiles: ['./tests/support/settings-permissions.ts'],
  },
});
