import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import path from 'node:path';

/** Where `tests/global-setup.ts` bundles just-bash, as `pnpm build` does into `dist/server/vendor`. */
export const JUST_BASH_BUNDLE_DIR: string = path.join(
  import.meta.dirname,
  'node_modules',
  '.cache',
  'just-bash-bundle',
);

// Server tests run in Node; client tests (tests/client) declare `@vitest-environment jsdom` themselves.
export default createReactVitestConfig({
  resolve: {
    // The online shell runs on the bundle a published plugin ships, not on the just-bash it is built from.
    alias: [
      {
        find: /^\.\.\/vendor\/just-bash\.js$/u,
        replacement: path.join(JUST_BASH_BUNDLE_DIR, 'just-bash.js'),
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    globalSetup: ['tests/global-setup.ts'],
  },
});
