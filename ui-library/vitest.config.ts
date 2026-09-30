import { fileURLToPath } from 'node:url';

import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// The tests render the registry sources against the preview's primitives, the same `@/` the preview resolves, so an
// item is tested as `shadcn add` installs it rather than as a template happens to carry it.
export default createReactVitestConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./website', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
