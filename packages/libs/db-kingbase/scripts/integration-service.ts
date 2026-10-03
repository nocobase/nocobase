import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db kingbase`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'kingbase',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'kingbase',
  containerPort: 54321,
  hostEnvironmentVariable: 'KINGBASE_HOST',
  portEnvironmentVariable: 'KINGBASE_PORT',
};
