import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db mssql`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'mssql',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'mssql',
  containerPort: 1433,
  hostEnvironmentVariable: 'MSSQL_HOST',
  portEnvironmentVariable: 'MSSQL_PORT',
  initServices: ['mssql-init'],
};
