// A minimal application laid out the way a generated one is, with the demo mode plugin registered. Its database
// configuration names no connection of its own, so every database it opens is one a test provisioned.
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

import demoMode from '../../../../server/index.js';
import { fixtureRoutes } from './routes.js';

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
        };
      },
    }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
  }),
  plugins: defineServerPlugins([demoMode]),
  serviceProviders: [],
  routes: [fixtureRoutes],
});

export default appRuntime;
