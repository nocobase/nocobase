import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db mysql`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'mysql',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'mysql',
  containerPort: 3306,
  hostEnvironmentVariable: 'MYSQL_HOST',
  portEnvironmentVariable: 'MYSQL_PORT',
};
