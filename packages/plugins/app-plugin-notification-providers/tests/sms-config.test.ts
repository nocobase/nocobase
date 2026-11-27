import { describe, expect, it } from 'vitest';
import {
  AppConfig,
  buildVariablesManifest,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import {
  defineMailChannelsConfig,
  type MailChannelsConfig,
} from '@nocobase/app-plugin-notification-providers/config';

async function snapshot(
  factory: AppConfigFactory<MailChannelsConfig>,
  environment: Record<string, string> = {},
) {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ notification: await factory({} as never) });
  config.defineSections(new Map([['notification', factory.rules!]]));
  await config.loadSectionEnvironment(environment);
  return {
    value: config.get('notification'),
    issues: await config.validate(),
    public: config.publicValues(),
    variables: buildVariablesManifest({
      app: { name: 'synthetic' },
      variables: factory.rules?.env ?? {},
      defaults: {},
    }).variables,
  };
}

const templates = { code: { templateId: 'SMS_1', params: { code: 'code' } } };

describe('SMS channel configuration', () => {
  it('maps the private credentials onto the system-sms channel and keeps them out of the public values', async () => {
    const result = await snapshot(
      defineMailChannelsConfig({
        defaults: {
          channels: {
            'system-sms': {
              type: 'sms',
              service: 'aliyun',
              templates,
            },
          },
        },
      }),
      {
        SMS_ALIYUN_ACCESS_KEY_ID: 'synthetic-id',
        SMS_ALIYUN_ACCESS_KEY_SECRET: 'synthetic-secret',
        SMS_SIGN_NAME: 'Example',
      },
    );
    expect(result.issues).toEqual([]);
    expect(result.public).toEqual({});
    expect(result.value).toMatchObject({
      channels: {
        'system-sms': {
          signName: 'Example',
          aliyun: {
            accessKeyId: 'synthetic-id',
            accessKeySecret: 'synthetic-secret',
          },
        },
      },
    });
    const byName = new Map(result.variables.map((v) => [v.name, v]));
    for (const name of [
      'SMS_ALIYUN_ACCESS_KEY_ID',
      'SMS_ALIYUN_ACCESS_KEY_SECRET',
      'SMS_TENCENT_SECRET_ID',
      'SMS_TENCENT_SECRET_KEY',
    ])
      expect(byName.get(name)).toMatchObject({ secret: true });
  });

  it.each([
    [{ type: 'sms', service: 'aliyun', signName: 'S', templates }, 1],
    [
      {
        type: 'sms',
        service: 'tencent',
        signName: 'S',
        templates,
        tencent: { secretId: 'a', secretKey: 'b', sdkAppId: '1' },
      },
      0,
    ],
    [{ type: 'sms', enabled: false }, 0],
  ])('validates an sms channel: %j', async (channel, errors) => {
    const result = await snapshot(
      defineMailChannelsConfig({ defaults: { channels: { sms: channel } } }),
    );
    expect(result.issues).toHaveLength(errors);
    expect(JSON.stringify(result.issues)).not.toContain('secretKey');
  });
});
