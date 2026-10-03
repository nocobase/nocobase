import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db oracle`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'oracle',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'oracle',
  containerPort: 1521,
  hostEnvironmentVariable: 'ORACLE_HOST',
  portEnvironmentVariable: 'ORACLE_PORT',
};
