import { createApplicationConfig } from '@nocobase/dev-config/eslint';

export default createApplicationConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    '.extension-state/**',
    'client-old/**',
    'public/r/**',
    'storage/**',
    // Internal workspace packages own their lint and TypeScript configurations.
    'packages/**',
  ],
});
