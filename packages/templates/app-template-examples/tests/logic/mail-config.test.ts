// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-server/runtime';
import mail from '../../server/config/mail.js';

describe('Examples Mail environment composition', () => {
  it('keeps the actual wrapper rules and offline providers through runtime loading', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        createAppConfig: () => new AppConfig(),
        defaultConfigs: defaultAppConfigs({ mail }),
        plugins: defineServerPlugins([]),
        serviceProviders: [],
        routes: [],
      }),
      {
        id: 'examples-mail-config-test',
        appName: 'examples-mail-config-test',
        basePath: '',
        mode: 'embedded',
        paths: { rootDir: process.cwd() },
        env: {
          MAIL_OAUTH_RETURN_URL: '/mail/accounts',
          MAIL_SYNC_BATCH_SIZE: '15',
        },
        registerDisposer(): void {},
      },
    );
    expect(runtime.config.get('mail.oauthReturnUrl')).toBe('/mail/accounts');
    expect(runtime.config.get('mail.syncBatchSize')).toBe(15);
    expect(runtime.config.get('mail.providers')).toEqual({
      demo: { type: 'mail-example' },
      'demo-microsoft': { type: 'mail-example-microsoft' },
      'demo-imap-smtp': { type: 'mail-example-imap-smtp' },
    });
    expect(runtime.config.get('mail.mail')).toBeUndefined();
    expect(
      Object.keys(runtime.config.sectionEnvironmentVariables()),
    ).toHaveLength(7);
    expect(runtime.config.publicValues()).toEqual({});
  });
});
