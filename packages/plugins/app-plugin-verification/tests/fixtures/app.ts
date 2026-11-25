import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import notification, {
  type NotificationConfigInput,
} from '@nocobase/app-plugin-notification/server';
import type { SmsChannelConfig } from '@nocobase/app-plugin-notification-providers/sms';
import notificationProviders from '@nocobase/app-plugin-notification-providers/server';
import { CachingProvider } from '@nocobase/app-server/caching';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  type AppIdentityConfig,
} from '@nocobase/app-server/config';
import {
  DatabaseProvider,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';
import { I18nProvider } from '@nocobase/app-server/i18n';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';
import { LoggingProvider } from '@nocobase/app-server/logging';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import { QueueServiceProvider } from '@nocobase/app-server/queue';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { SecretsProvider } from '@nocobase/app-server/secrets';

import verification, { defineVerificationConfig } from '../../server/index.js';

export const fixtureSmsSecret = 'fixture-test-only-sms-secret';

const smsChannel = {
  type: 'sms',
  service: 'aliyun',
  signName: 'Example',
  aliyun: {
    accessKeyId: 'example-key-id',
    accessKeySecret: fixtureSmsSecret,
  },
  templates: {
    code: { templateId: 'SMS_EXAMPLE', params: { code: 'code' } },
  },
} satisfies SmsChannelConfig;

const appRuntime = defineAppRuntime({
  createAppConfig(context) {
    const config = new AppConfig();
    if (context.configPath)
      config.loadFile(context.paths.root(context.configPath));
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
        trustedOrigins: ['http://localhost'],
        advanced: {
          ipAddress: { trustedProxies: ['192.0.2.10', '192.0.2.11'] },
        },
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
    notification: defineAppConfig<NotificationConfigInput>({
      defaults: {
        channels: { sms: smsChannel },
      },
    }),
    verification: defineVerificationConfig({
      defaults: {
        resendSeconds: 10,
        hourlyLimit: 3,
        maxAttempts: 3,
        ttlSeconds: 300,
      },
      ipHourlyLimit: 8,
      userHourlyLimit: 4,
      bindPhone: { channel: 'sms', template: 'code' },
      stepUp: { channel: 'sms', template: 'code' },
    }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
    secrets: defineAppConfig({
      defaults: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
    }),
  }),
  routes: [],
  serviceProviders: [],
  plugins: defineServerPlugins([
    authentication,
    authorization,
    notification,
    notificationProviders,
    verification,
  ]),
});

export const { create: createStandaloneServer } = defineStandaloneServer({
  rootDir: import.meta.dirname,
  appRuntime,
  async createServer(scope) {
    const runtime = await resolveAppRuntime(appRuntime, scope);
    const app = createAppFromRuntime(runtime);
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(CachingProvider);
    app.addServiceProvider(IdGeneratorProvider);
    app.addServiceProvider(I18nProvider);
    app.addServiceProvider(LoggingProvider);
    app.addServiceProvider(SecretsProvider);
    app.addServiceProvider(QueueServiceProvider, { nodeEnv: 'test' });
    app.addServiceProvider(JobExecutorServiceProvider, { nodeEnv: 'test' });
    app.addRuntimeContributions(runtime);
    return startApplicationInScope(scope, app);
  },
});
