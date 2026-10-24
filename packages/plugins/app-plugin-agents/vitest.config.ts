import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';
import path from 'node:path';

export const JUST_BASH_BUNDLE_DIR: string = path.join(
  import.meta.dirname,
  'node_modules',
  '.cache',
  'just-bash-bundle',
);

// Server tests run in Node; client tests (tests/client) declare `@vitest-environment jsdom` themselves.
export default createReactVitestConfig({
  resolve: {
    // Exercise the same lightweight runtime that the published plugin ships.
    alias: [
      {
        find: /^.*\/vendor\/just-bash\.js$/u,
        replacement: path.join(JUST_BASH_BUNDLE_DIR, 'just-bash.js'),
      },
    ],
  },
  test: {
    globalSetup: ['tests/global-setup.ts'],
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
