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

import demoMode from '../../server/index.js';
import { defineDemoModeConfig } from '../../server/config.js';
import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import users from '@nocobase/app-plugin-users/server';
import { DemoProvider } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/providers/demo.js';
import { demoProjectRoutes } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/routes/demo-projects.js';

const appRuntime: AppRuntimeDefinition = defineAppRuntime({
  createAppConfig: (context) => {
    const config = new AppConfig();
    const configPath =
      context.configPath ?? context.environment.APP_CONFIG_FILE;
    if (configPath) config.loadFile(context.paths.root(configPath));
    return config;
  },
  defaultConfigs: defaultAppConfigs({
    demoMode: defineDemoModeConfig(),
    caching: defineAppConfig({
      defaults: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
    }),
    snowflake: defineAppConfig({ defaults: { workerId: 0 } }),
    auth: defineAuthConfig({
      defaults: {
        secret: 'minimal-demo-test-secret-at-least-32-characters',
        baseURL: 'http://localhost/main/api/auth',
        emailAndPassword: { enabled: true },
        session: { storeSessionInDatabase: true },
      },
    }),
    users: defineAppConfig({ defaults: { permissionSets: true } }),
    app: defineAppConfig({
      defaults: ({ routing }): AppIdentityConfig => {
        const publicBasePath = normalizeBasePath(
          routing.publicBasePath || '/main',
        );
        return {
          publicOrigin: 'http://localhost',
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
  plugins: defineServerPlugins([
    authentication,
    authorization,
    users,
    demoMode,
  ]),
  serviceProviders: [DemoProvider],
  routes: [demoProjectRoutes],
  locales: {
    'en-US': async () => ({ default: {} }),
    'zh-CN': async () => ({ default: {} }),
  },
});

export default appRuntime;
