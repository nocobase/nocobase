import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

/** Installed official drivers are loaded synchronously when first needed. */
export default defineAppDatabaseConfig(
  ({ paths }) => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite',
        filename: paths.storage('hub/database/main.sqlite'),
        schemaManagement: 'managed',
        debug: false,
      },
    },
  }),
  // DB_DIALECT, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_SSL and DB_FILENAME set the main
  // connection. Another connection declares its own, such as connectionEnvironment('analytics', 'DB_ANALYTICS').
  { env: connectionEnvironment('main') },
);
