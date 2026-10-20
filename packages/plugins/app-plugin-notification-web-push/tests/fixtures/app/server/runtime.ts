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

import webPush, { pushConfig } from '../../../../server/index.js';
import notification from '@nocobase/app-plugin-notification/server';

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
        secret: 'web-push-test-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
        emailAndPassword: { enabled: true, autoSignIn: false },
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
    notification: defineMailChannelsConfig({
      defaults: { channels: { webPush: { provider: 'web-push' } } },
    }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
    push: pushConfig,
    secrets: defineAppConfig({
      defaults: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
    }),
  }),
  plugins: defineServerPlugins([
    authentication,
    authorization,
    notification,
    webPush,
  ]),
  serviceProviders: [],
  routes: [],
});

export default runtime;
