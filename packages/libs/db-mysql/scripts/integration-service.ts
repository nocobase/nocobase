import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

const composeFile = fileURLToPath(
  new URL('../docker-compose.yml', import.meta.url),
);

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db mysql`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'mysql',
  composeFile,
  service: 'mysql',
  containerPort: 3306,
  hostEnvironmentVariable: 'MYSQL_HOST',
  portEnvironmentVariable: 'MYSQL_PORT',
};

/**
 * MariaDB, which this dialect also serves. The integration suite runs against
 * it after MySQL, because the two differ where nothing else would notice: how
 * `information_schema` reports a column default, and which JSON functions
 * exist.
 */
export const mariadbIntegrationService: DatabaseServiceOptions = {
  ...integrationService,
  name: 'mariadb',
  service: 'mariadb',
};
