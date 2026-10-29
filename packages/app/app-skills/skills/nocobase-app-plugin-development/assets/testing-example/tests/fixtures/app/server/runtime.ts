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
import { defineMailChannelsConfig } from '@nocobase/app-server/mailer';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-server/runtime';

import readingList, {
  defineReadingListConfig,
} from '../../../../server/index.js';

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
    auth: defineAuthConfig({
      defaults: {
        secret: 'reading-list-test-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
        emailAndPassword: { enabled: true, autoSignIn: false },
      },
    }),
    caching: defineAppConfig({
      defaults: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
    }),
    snowflake: defineAppConfig({ defaults: { workerId: 1 } }),
    notification: defineMailChannelsConfig({ defaults: { channels: {} } }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
    readingList: defineReadingListConfig(),
  }),
  plugins: defineServerPlugins([authentication, authorization, readingList]),
  serviceProviders: [],
  routes: [],
});

export default runtime;
