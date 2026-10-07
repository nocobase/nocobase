import { fileURLToPath } from 'node:url';

import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

import { installedItemAliases } from './vite.config';

// The tests render the registry sources against the preview's primitives, the same `@/` the preview resolves, so an
// item is tested as `shadcn add` installs it rather than as a template happens to carry it. An item that imports
// another item's file (`@/components/agent-run-history`) reaches its source, as in the preview.
export default createReactVitestConfig({
  resolve: {
    alias: [
      ...installedItemAliases(),
      // A component one item installs for another, imported as the application provides it.
      {
        find: /^@\/components\/page-header$/,
        replacement: fileURLToPath(
          new URL('./registry/components/page-header.tsx', import.meta.url),
        ),
      },
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
