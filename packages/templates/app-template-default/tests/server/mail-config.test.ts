import { describe, expect, it } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-server/runtime';
import mail from '../../server/config/mail.js';

describe('Default Mail environment composition', () => {
  it('keeps the actual wrapper rules and mailbox defaults through runtime loading', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        createAppConfig: () => new AppConfig(),
        defaultConfigs: defaultAppConfigs({ mail }),
        plugins: defineServerPlugins([]),
        serviceProviders: [],
        routes: [],
      }),
      {
        id: 'default-mail-config-test',
        appName: 'default-mail-config-test',
        basePath: '',
        mode: 'embedded',
        paths: { rootDir: process.cwd() },
        env: {
          MAIL_OAUTH_RETURN_URL: '/mail/accounts',
          MAIL_SYNC_BATCH_SIZE: '15',
          MAIL_PROVIDER: 'smtp',
          MAIL_HOST: 'smtp.example.test',
          MAIL_PORT: '2525',
        },
        registerDisposer(): void {},
      },
    );
    expect(runtime.config.get('mail.oauthReturnUrl')).toBe('/mail/accounts');
    expect(runtime.config.get('mail.syncBatchSize')).toBe(15);
    expect(runtime.config.get('mail.providers')).toEqual({});
    expect(runtime.config.get('mail.mail')).toBeUndefined();
    expect(runtime.config.get('mail.default')).toEqual({
      provider: 'smtp',
      host: 'smtp.example.test',
      port: 2525,
    });
    expect(runtime.config.sectionEnvironmentVariables()).toMatchObject({
      MAIL_HOST: 'mail.default.host',
      MAIL_OAUTH_RETURN_URL: 'mail.oauthReturnUrl',
    });
    expect(await runtime.config.validate()).toEqual([]);
    expect(runtime.config.publicValues()).toEqual({});
  });
});
