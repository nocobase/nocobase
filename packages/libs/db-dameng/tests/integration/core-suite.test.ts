import {
  installDatabaseIntegrationAdapter,
  loadDatabaseIntegrationTests,
} from '@nocobase/db-testkit';
import { damengDialectIntegrationAdapter } from './adapter.js';

declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options?: { eager?: boolean },
    ): Record<string, () => Promise<unknown>>;
  }
}

installDatabaseIntegrationAdapter(damengDialectIntegrationAdapter);
await import('./reset-managed-schema.test.js');
await import('./test-provisioner.test.js');
process.chdir(new URL('../../../db-testkit/', import.meta.url).pathname);

const loadTests = import.meta.glob(
  '../../../db-testkit/tests/integration/**/*.test.ts',
  {
    eager: false,
  },
);

await loadDatabaseIntegrationTests(loadTests);
