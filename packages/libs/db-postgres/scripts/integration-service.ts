import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db postgres`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'postgres',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'postgres',
  containerPort: 5432,
  hostEnvironmentVariable: 'POSTGRES_HOST',
  portEnvironmentVariable: 'POSTGRES_PORT',
};
