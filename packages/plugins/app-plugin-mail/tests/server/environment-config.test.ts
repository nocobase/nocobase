import { describe, expect, it } from 'vitest';
import {
  AppConfig,
  buildVariablesManifest,
  defaultAppConfigs,
  defineAppConfig,
  envString,
  type AppConfigFactory,
  type EnvironmentMapping,
} from '@nocobase/app-server/config';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-server/runtime';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import { environmentProvider } from '@nocobase/config/providers/env';
import {
  DEFAULT_MAIL_CONFIG,
  mailConfig,
  mailEnvironmentMappings,
  resolveMailConfig,
} from '../../server/config.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const environment = {
  MAIL_OAUTH_CALLBACK_URL: '/mail/oauth/callback',
  MAIL_OAUTH_RETURN_URL: '/mail/accounts',
  MAIL_AUTOMATIC_SYNC_INTERVAL_MS: '120000',
  MAIL_SYNC_BATCH_SIZE: '150',
  MAIL_PUSH_WEBHOOK_URL: 'https://example.test/hooks/mail',
  MAIL_PUSH_WEBHOOK_SECRET: 'fixture-private-webhook-secret',
  MAIL_JOBS: 'mailTasks',
};
async function configuration(
  env: Readonly<Record<string, string | undefined>> = {},
  overrides: Record<string, unknown> = {},
  factories: Record<string, AppConfigFactory> = { mail: mailConfig },
  legacy?: Readonly<Record<string, EnvironmentMapping>>,
) {
  const definition = defineAppRuntime({
    createAppConfig: () => {
      const config = new AppConfig().load({
        name: 'configuration-file',
        read: async () => ({ kind: 'map', value: overrides }),
      });
      if (legacy)
        config.load(
          environmentProvider(env, {
            name: 'legacy-environment',
            mappings: legacy,
          }),
        );
      return config;
    },
    defaultConfigs: defaultAppConfigs(factories),
    plugins: defineServerPlugins([]),
    serviceProviders: [],
    routes: [],
  });
  const runtime = await resolveAppRuntime(definition, {
    id: 'mail-env-test',
    appName: 'mail-env-test',
    basePath: '',
    mode: 'embedded',
    paths: { rootDir: process.cwd() },
    env,
    registerDisposer(): void {},
  });
  return runtime.config;
}

describe('Mail section environment integration', () => {
  it('composes the actual factory, parses all seven variables and retains providers above file defaults', async () => {
    const providers = {
      google: {
        type: 'gmail',
        clientId: 'fixture-client',
        clientSecret: 'fixture-private-provider-secret',
      },
    };
    const config = await configuration(environment, {
      mail: { providers, syncBatchSize: 12, oauthReturnUrl: '/from-file' },
    });
    expect(config.get('mail')).toEqual({
      ...DEFAULT_MAIL_CONFIG,
      providers,
      oauthCallbackUrl: environment.MAIL_OAUTH_CALLBACK_URL,
      oauthReturnUrl: environment.MAIL_OAUTH_RETURN_URL,
      automaticSyncIntervalMs: 120000,
      syncBatchSize: 150,
      pushWebhookUrl: environment.MAIL_PUSH_WEBHOOK_URL,
      pushWebhookSecret: environment.MAIL_PUSH_WEBHOOK_SECRET,
      jobs: environment.MAIL_JOBS,
    });
    expect(config.get('mail.mail')).toBeUndefined();
    expect(Object.keys(config.sectionEnvironmentVariables()).sort()).toEqual(
      [...packageMetadata.nocobase.appConfig.environmentVariables].sort(),
    );
    expect(config.sectionEnvironmentVariables()).toEqual(
      Object.fromEntries(
        Object.entries(mailEnvironmentMappings).map(([name, mapping]) => [
          name,
          mapping.path,
        ]),
      ),
    );
    expect(config.publicValues()).toEqual({});
    expect(config.publicPaths()).toEqual([]);
  });
  it('preserves defaults with no variables, including undefined rather than fabricated values', async () => {
    expect((await configuration({ MAIL_JOBS: undefined })).get('mail')).toEqual(
      DEFAULT_MAIL_CONFIG,
    );
  });
  it('describes optional deployment variables without exposing private values', async () => {
    const config = await configuration(environment);
    const manifest = buildVariablesManifest({
      app: { name: 'mail-env-test' },
      variables: config.environmentVariableMappings(),
      defaults: config.layers().defaults,
    });
    const variables = manifest.variables.filter((entry) =>
      entry.name.startsWith('MAIL_'),
    );
    expect(variables).toHaveLength(7);
    expect(variables.every((entry) => entry.required === false)).toBe(true);
    expect(
      variables.find((entry) => entry.name === 'MAIL_PUSH_WEBHOOK_SECRET'),
    ).toMatchObject({
      path: 'mail.pushWebhookSecret',
      secret: true,
      required: false,
    });
    expect(JSON.stringify(manifest)).not.toContain(
      environment.MAIL_PUSH_WEBHOOK_SECRET,
    );
  });
  it('derives legacy full paths without losing parser identity or metadata', () => {
    const mappings = mailConfig.rules?.env;
    if (!mappings) throw new Error('Mail section mappings must be present');
    for (const [name, mapping] of Object.entries(mappings)) {
      expect(mailEnvironmentMappings[name]).toEqual({
        ...mapping,
        path: `mail.${mapping.path}`,
      });
      expect(mailEnvironmentMappings[name].parse).toBe(mapping.parse);
    }
  });
  it('supports the old application-level provider alongside section rules', async () => {
    const old = await configuration(
      environment,
      {},
      { mail: defineAppConfig({ defaults: DEFAULT_MAIL_CONFIG }) },
      mailEnvironmentMappings,
    );
    const both = await configuration(
      environment,
      {},
      { mail: mailConfig },
      mailEnvironmentMappings,
    );
    expect(both.get('mail')).toEqual(old.get('mail'));
  });
  it('makes section priority explicit and lets wrappers preserve custom parsers', async () => {
    const custom = {
      ...mailEnvironmentMappings,
      MAIL_SYNC_BATCH_SIZE: {
        ...mailEnvironmentMappings.MAIL_SYNC_BATCH_SIZE,
        parse: () => 25,
      },
    };
    expect(
      (await configuration(environment, {}, { mail: mailConfig }, custom)).get(
        'mail.syncBatchSize',
      ),
    ).toBe(150);
    const wrapped = defineAppConfig({
      defaults: mailConfig,
      env: {
        ...mailConfig.rules?.env,
        MAIL_SYNC_BATCH_SIZE: {
          path: 'syncBatchSize',
          type: 'integer',
          parse: () => 25,
        },
      },
    });
    const result = await configuration(
      environment,
      {},
      { mail: wrapped },
      custom,
    );
    expect(result.get('mail.syncBatchSize')).toBe(25);
    expect(result.get('mail.oauthReturnUrl')).toBe('/mail/accounts');
  });
  it('does not inherit section rules merely by calling the default-value function', async () => {
    const wrapper = defineAppConfig((runtime) => mailConfig(runtime));
    const result = await configuration(environment, {}, { mail: wrapper });
    expect(result.get('mail')).toEqual(DEFAULT_MAIL_CONFIG);
    expect(result.sectionEnvironmentVariables()).toEqual({});
  });
  it.each(['', ' ', '1.5', 'invalid'])(
    'rejects invalid or empty integer values: %j',
    async (value) => {
      await expect(
        configuration({ MAIL_SYNC_BATCH_SIZE: value }),
      ).rejects.toThrow('Expected an integer');
    },
  );
  it.each([
    ['MAIL_SYNC_BATCH_SIZE', '0'],
    ['MAIL_SYNC_BATCH_SIZE', '201'],
    ['MAIL_AUTOMATIC_SYNC_INTERVAL_MS', '59999'],
    ['MAIL_AUTOMATIC_SYNC_INTERVAL_MS', '9007199254740992'],
  ])('keeps numeric boundary validation for %s=%s', async (name, value) => {
    const config = await configuration({ [name]: value });
    expect(() => resolveMailConfig(config.get('mail'))).toThrow();
  });
  it.each([{}, { MAIL_JOBS: 'mailTasks' }])(
    'rejects cross-section variable collisions even if unset: %j',
    async (env) => {
      await expect(
        configuration(
          env,
          {},
          {
            mail: mailConfig,
            other: defineAppConfig({
              defaults: {},
              env: { MAIL_JOBS: envString('jobs') },
            }),
          },
        ),
      ).rejects.toThrow(
        'Environment variable MAIL_JOBS is declared for both mail.jobs and other.jobs',
      );
    },
  );
});
