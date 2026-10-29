// A minimal application laid out the way a generated one is: its configuration file is the deployment's, and its
// database configuration names no connection of its own, so every database it opens is one a test provisioned.
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  type AppIdentityConfig,
} from '@nocobase/app-server/config';
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  joinBasePath,
  normalizeBasePath,
  resolveAppNameFromBasePath,
} from '@nocobase/app-server/support';
import {
  defineAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-server/runtime';

import authenticationPlugin, { defineAuthConfig } from '../../../../index.js';
// Legacy recovery still uses the host factory. Importing notification providers here would create a dependency cycle.
import { defineMailChannelsConfig } from '@nocobase/app-server/mailer';

const appRuntime: AppRuntimeDefinition = defineAppRuntime({
  createAppConfig: (context) => {
    const config = new AppConfig();
    const configPath =
      context.configPath ?? context.environment.APP_CONFIG_FILE;
    if (configPath) config.loadFile(context.paths.root(configPath));
    return config;
  },
  defaultConfigs: defaultAppConfigs({
    app: defineAppConfig({
      defaults: ({ routing }): AppIdentityConfig => {
        const publicBasePath = normalizeBasePath(
          routing.publicBasePath || '/main',
        );
        return {
          name:
            routing.name || resolveAppNameFromBasePath(publicBasePath, 'main'),
          publicBasePath,
          internalBasePath: routing.internalBasePath,
          publicApiUrl: joinBasePath(publicBasePath, '/api'),
          publicOrigin: 'http://localhost',
        };
      },
    }),
    auth: defineAuthConfig({
      defaults: {
        secret: 'synthetic-auth-secret-at-least-32-characters',
        emailAndPassword: { enabled: true },
        passwordReset: { enabled: true },
      },
    }),
    notification: defineMailChannelsConfig({ defaults: { channels: {} } }),
    caching: defineAppConfig({
      defaults: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
    }),
    snowflake: defineAppConfig({ defaults: { workerId: 1 } }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
  }),
  plugins: defineServerPlugins([authenticationPlugin]),
  serviceProviders: [],
  routes: [],
});

export default appRuntime;
