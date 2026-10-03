import { fileURLToPath } from 'node:url';
import type { DatabaseServiceOptions } from '@nocobase/db-testkit/integration-runner';

/**
 * The Compose service this dialect's tests run against. Shared by the
 * integration suite and by the repository's `pnpm test:db dameng`.
 */
export const integrationService: DatabaseServiceOptions = {
  name: 'dameng',
  composeFile: fileURLToPath(new URL('../docker-compose.yml', import.meta.url)),
  service: 'dameng',
  containerPort: 5236,
  hostEnvironmentVariable: 'DAMENG_HOST',
  portEnvironmentVariable: 'DAMENG_PORT',
  initServices: ['dameng-init'],
  testEnvironment: { NODE_OPTIONS: '--openssl-legacy-provider' },
};
