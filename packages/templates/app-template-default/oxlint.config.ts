import { createApplicationConfig } from '@nocobase/dev-config/oxlint';

export default createApplicationConfig({
  ignores: [
    '.extension-state/**',
    'client-old/**',
    'public/r/**',
    'storage/**',
    // Internal workspace packages own their lint and TypeScript configurations.
    'packages/**',
  ],
});
