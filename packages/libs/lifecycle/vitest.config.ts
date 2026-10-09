import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

// The React entry is tested in a DOM; everything else runs on Node.
export default defineConfig({
  test: {
    projects: [
      createReactVitestConfig({
        test: { name: 'client', include: ['tests/client/**/*.test.tsx'] },
      }),
      createNodeVitestConfig({
        test: { name: 'node', include: ['tests/*.test.ts'] },
      }),
    ],
  },
});
