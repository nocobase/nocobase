import { createApplicationConfig } from '@nocobase/dev-config/eslint';
import { resolve } from 'node:path';

const applicationConfig = createApplicationConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    '.extension-state/**',
    'client-old/**',
    'public/r/**',
    'storage/**',
  ],
});

// ESLint 10 discovers this nearest config even when invoked from the source repository.
// That workspace has no application dependencies. The equipment PR job installs this
// application's own lockfile and runs its complete lint from this directory instead.
export default process.cwd() === resolve(import.meta.dirname, '../..')
  ? [{ ignores: ['**'] }]
  : applicationConfig;
