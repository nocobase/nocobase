import { fileURLToPath } from 'node:url';

import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['*.test.ts'],
    // TODO: Re-enable Workflow skill evaluation tests with the capability tests.
    exclude: ['**/*.test.ts'],
    passWithNoTests: true,
  },
});
