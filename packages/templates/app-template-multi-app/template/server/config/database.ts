import type { AppConfigFactory } from '@nocobase/app-server/config';
import type { AppDatabaseConfig } from '@nocobase/app-server/database';
import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

/** Installed official drivers are loaded synchronously when first needed. */
const database: AppConfigFactory<AppDatabaseConfig> = defineAppDatabaseConfig(
  ({ paths }) => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite',
        filename: paths.storage('database.sqlite'),
        // Package relocation must not rename previously recorded migration/seed ownership.
        migrations: { packageName: 'app-example-multi-app' },
        seeds: { packageName: 'app-example-multi-app' },
        schemaManagement: 'managed',
        debug: false,
      },
    },
  }),
  // DB_DIALECT, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_SSL and DB_FILENAME set the main
  // connection. Another connection declares its own, such as connectionEnvironment('analytics', 'DB_ANALYTICS').
  { env: connectionEnvironment('main') },
);

export default database;
