import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db oceanbase`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'oceanbase',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'oceanbase',
  containerPort: 2881,
  hostEnvironmentVariable: 'OCEANBASE_HOST',
  portEnvironmentVariable: 'OCEANBASE_PORT',
};
