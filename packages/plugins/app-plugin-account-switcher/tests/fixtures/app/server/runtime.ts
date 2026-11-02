// A minimal application laid out the way a generated one is, with account switching and what it depends on registered.
// Its database configuration names no connection of its own, so every database it opens is one a test provisioned.
import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  type AppIdentityConfig,
} from '@nocobase/app-server/config';
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-server/runtime';

import { defineAccountSwitcherConfig } from '../../../../server/config.js';
import accountSwitcher from '../../../../server/index.js';

const runtime: AppRuntimeDefinition = defineAppRuntime({
  createAppConfig(context) {
    const config = new AppConfig();
    const configPath =
      context.configPath ?? context.environment.APP_CONFIG_FILE;
    if (configPath) config.loadFile(context.paths.root(configPath));
    return config;
  },
  defaultConfigs: defaultAppConfigs({
    app: defineAppConfig<AppIdentityConfig>({
      defaults: {
        name: 'main',
        publicBasePath: '/main',
        internalBasePath: '',
        publicApiUrl: '/main/api',
        publicOrigin: 'http://localhost',
      },
    }),
    accountSwitcher: defineAccountSwitcherConfig(),
    auth: defineAuthConfig({
      defaults: {
        secret: 'account-switcher-test-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
        emailAndPassword: { enabled: true, autoSignIn: false },
        session: { storeSessionInDatabase: true },
      },
    }),
    logging: defineAppConfig({
      defaults: {
        level: 'error',
        file: { enabled: false },
        console: { enabled: false },
      },
    }),
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
    secrets: defineAppConfig({
      defaults: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
    }),
  }),
  plugins: defineServerPlugins([
    authentication,
    authorization,
    accountSwitcher,
  ]),
  serviceProviders: [],
  routes: [],
});

export default runtime;
