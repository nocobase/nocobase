import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      createNodeVitestConfig({
        test: { name: 'server', include: ['tests/**/*.test.ts'] },
      }),
      createReactVitestConfig({
        test: { name: 'client', include: ['tests/**/*.test.tsx'] },
      }),
    ],
  },
});
