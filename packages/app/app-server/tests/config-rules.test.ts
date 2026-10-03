// db-test-portability: sqlite-only — the application configuration under test names SQLite
import { describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import {
  AppConfig,
  AppConfigInvalidError,
  createAppPaths,
  defaultAppConfigs,
  defineAppConfig,
  type AppConfigFactory,
} from '../src/config/index.js';
import type { AppRuntimeContext } from '../src/runtime/definition.js';
import { injectSpaRuntimeHtml } from '../src/spa/index.js';

interface BillingConfig {
  readonly currency: string;
  readonly trialDays: number;
  readonly stripeSecret?: string;
}

const runtime = {} as AppRuntimeContext;

async function createConfig(
  factories: Record<string, AppConfigFactory>,
  overrides: Record<string, unknown> = {},
): Promise<AppConfig> {
  let current = overrides;
  const config = new AppConfig().load({
    name: 'test',
    read: async () => ({ kind: 'map', value: current }),
  });
  await config.loadAll();
  const defaults = defaultAppConfigs(factories);
  config.mergeDefaults(defaults(runtime));
  config.defineSections(defaults.sections!);
  Object.assign(config, {
    replaceOverrides(next: Record<string, unknown>): void {
      current = next;
    },
  });
  return config;
}

function billing(
  options: {
    readonly public?: readonly string[];
  } = {},
): AppConfigFactory<BillingConfig> {
  return defineAppConfig<BillingConfig>({
    defaults: { currency: 'USD', trialDays: 14 },
    async validate(value, context) {
      await Promise.resolve();
      if (value.trialDays < 0) {
        context.error('trialDays', 'must not be negative.', {
          fix: 'Set billing.trialDays to 0 or more.',
        });
      }
      if (!value.stripeSecret) {
        context.warning('stripeSecret', 'is not set; payments are disabled.');
      }
    },
    public: options.public ?? ['currency', 'trialDays'],
  });
}

describe('defineAppConfig', () => {
  it('keeps the function shorthand as the defaults', () => {
    const factory = defineAppConfig(() => ({ label: 'default' }));

    expect(factory(runtime)).toEqual({ label: 'default' });
    expect(factory.rules).toBeUndefined();
  });

  it('accepts defaults as an object or a function of the runtime', () => {
    const fromObject = defineAppConfig({ defaults: { label: 'object' } });
    const fromFunction = defineAppConfig({
      defaults: (context: AppRuntimeContext) => ({
        label: context === runtime ? 'function' : 'other',
      }),
    });

    expect(fromObject(runtime)).toEqual({ label: 'object' });
    expect(fromFunction(runtime)).toEqual({ label: 'function' });
  });

  it('collects each section’s rules under its section name', () => {
    const defaults = defaultAppConfigs({
      billing: billing(),
      plain: defineAppConfig(() => ({})),
    });

    expect([...defaults.sections!.keys()]).toEqual(['billing']);
    expect(defaults.sections!.get('billing')!.public).toEqual([
      'currency',
      'trialDays',
    ]);
  });
});

describe('configuration validation', () => {
  it('reports errors and warnings with full paths', async () => {
    const config = await createConfig(
      { billing: billing() },
      { billing: { trialDays: -1 } },
    );

    expect(await config.validate()).toEqual([
      {
        level: 'error',
        path: 'billing.trialDays',
        message: 'must not be negative.',
        fix: 'Set billing.trialDays to 0 or more.',
      },
      {
        level: 'warning',
        path: 'billing.stripeSecret',
        message: 'is not set; payments are disabled.',
      },
    ]);
  });

  it('runs every validator registered for a section', async () => {
    const config = await createConfig({ billing: billing() });
    config.defineSections(
      new Map([
        [
          'billing',
          {
            validators: [
              ((_value, context) => {
                context.error('', 'is rejected by the application.');
              }) as never,
            ],
            public: [],
          },
        ],
      ]),
    );

    const issues = await config.validate();
    expect(issues.map((issue) => issue.message)).toContain(
      'is rejected by the application.',
    );
  });

  it('tells a value from the configuration file from a code default', async () => {
    const seen: boolean[] = [];
    const config = await createConfig(
      {
        feature: defineAppConfig({
          defaults: { a: 1, b: 2 },
          validate(_value, context) {
            seen.push(context.isUserProvided('a'), context.isUserProvided('b'));
          },
        }),
      },
      { feature: { a: 3 } },
    );

    await config.validate();
    expect(seen).toEqual([true, false]);
  });

  it('records a validator that throws as an error on its section', async () => {
    const config = await createConfig({
      feature: defineAppConfig({
        defaults: {},
        validate() {
          throw new Error('boom');
        },
      }),
    });

    expect(await config.validate()).toEqual([
      { level: 'error', path: 'feature', message: 'validation failed: boom' },
    ]);
  });

  it('refuses to start an application whose configuration breaks a rule', async () => {
    const config = await createConfig(
      { billing: billing() },
      { billing: { trialDays: -1 } },
    );
    const app = new Application({
      config,
      paths: createAppPaths({ rootDir: '/test/app' }),
    });

    const failure = await app.start().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AppConfigInvalidError);
    expect((failure as Error).message).toBe(
      [
        'Application configuration is invalid:',
        '  ✖ billing.trialDays  must not be negative.',
        '      Set billing.trialDays to 0 or more.',
      ].join('\n'),
    );
  });

  it('refuses a reload that breaks a rule and keeps the running configuration', async () => {
    const config = await createConfig(
      { billing: billing() },
      { billing: { trialDays: 7 } },
    );
    (
      config as unknown as {
        replaceOverrides(next: Record<string, unknown>): void;
      }
    ).replaceOverrides({ billing: { trialDays: -1 } });

    await expect(config.reload()).rejects.toBeInstanceOf(AppConfigInvalidError);
    expect(config.get('billing.trialDays')).toBe(7);
  });
});

describe('public configuration', () => {
  it('publishes only the listed leaf paths', async () => {
    const config = await createConfig(
      { billing: billing() },
      { billing: { stripeSecret: 'sk_live' } },
    );

    expect(config.publicValues()).toEqual({
      billing: { currency: 'USD', trialDays: 14 },
    });
    expect(config.publicPaths()).toEqual([
      'billing.currency',
      'billing.trialDays',
    ]);
  });

  it('leaves out a public path with no value', async () => {
    const config = await createConfig({
      billing: billing({ public: ['currency', 'region'] }),
    });

    expect(config.publicValues()).toEqual({ billing: { currency: 'USD' } });
    expect(await config.validate()).not.toContainEqual(
      expect.objectContaining({ path: 'billing.region' }),
    );
  });

  it('refuses to publish an object, a function or the whole section', async () => {
    const config = await createConfig({
      auth: defineAppConfig({
        defaults: {
          secret: 'secret',
          emailAndPassword: { enabled: true },
          plugins: [() => undefined],
          hook: () => undefined,
        },
        public: ['emailAndPassword', 'plugins', 'hook', ''],
      }),
    });

    const issues = await config.validate();
    expect(issues.map((issue) => [issue.path, issue.message])).toEqual([
      [
        'auth.emailAndPassword',
        'cannot be published: name each field to expose instead of the whole object.',
      ],
      [
        'auth.plugins',
        'cannot be published: only plain values can reach the browser.',
      ],
      [
        'auth.hook',
        'cannot be published: only plain values can reach the browser.',
      ],
      [
        'auth',
        'cannot be published as a whole: name each field to expose instead.',
      ],
    ]);
    expect(config.publicValues()).toEqual({});
  });

  it('sends public values beside the client configuration, not inside it', () => {
    const html = injectSpaRuntimeHtml(
      '<html lang="en-US"><script type="module" src="/a.js"></script>',
      {
        clientConfig: { app: { title: 'NocoBase' } },
        publicConfig: {
          i18n: { defaultLocale: 'zh-CN' },
          auth: { emailAndPassword: { disableSignUp: true } },
        },
      },
    );
    const payload = JSON.parse(
      /<script id="nocobase-runtime-config" type="application\/json">(.*?)<\/script>/u.exec(
        html,
      )![1],
    ) as { config: unknown; public: unknown };

    expect(payload.config).toEqual({ app: { title: 'NocoBase' } });
    expect(payload.public).toEqual({
      i18n: { defaultLocale: 'zh-CN' },
      auth: { emailAndPassword: { disableSignUp: true } },
    });
    expect(html).toContain('<html lang="zh-CN">');
  });
});

describe('database section rules', () => {
  it('checks that the default connection is configured and every connection names a dialect', async () => {
    const { defineAppDatabaseConfig } =
      await import('../src/database/index.js');
    const config = await createConfig(
      {
        database: defineAppDatabaseConfig(() => ({
          default: 'main',
          connections: {},
        })),
      },
      {
        database: {
          default: 'primary',
          connections: { main: { dialect: 'sqlite' }, reports: {} },
        },
      },
    );

    expect(await config.validate()).toEqual([
      {
        level: 'error',
        path: 'database.default',
        message:
          'names the connection "primary", which is not configured. Configured connections: main, reports.',
      },
      {
        level: 'error',
        path: 'database.connections.reports.dialect',
        message: 'is not set.',
      },
    ]);
  });
});

describe('section environment variables', () => {
  it('maps the variables a section declares, above the configuration file', async () => {
    const { envBoolean, envString } = await import('../src/config/index.js');
    const config = await createConfig(
      {
        auth: defineAppConfig({
          defaults: { emailAndPassword: { enabled: true } },
          env: {
            AUTH_SECRET: envString('secret'),
            AUTH_DISABLE_SIGN_UP: envBoolean('emailAndPassword.disableSignUp'),
          },
        }),
      },
      { auth: { secret: 'from-file' } },
    );

    await config.loadSectionEnvironment({
      AUTH_SECRET: 'from-environment',
      AUTH_DISABLE_SIGN_UP: 'true',
      UNRELATED: 'ignored',
    });

    expect(config.get('auth.secret')).toBe('from-environment');
    expect(config.get('auth.emailAndPassword')).toEqual({
      enabled: true,
      disableSignUp: true,
    });
    expect(config.sectionEnvironmentVariables()).toEqual({
      AUTH_SECRET: 'auth.secret',
      AUTH_DISABLE_SIGN_UP: 'auth.emailAndPassword.disableSignUp',
    });
  });

  it('refuses one variable declared for two different fields', async () => {
    const { envString } = await import('../src/config/index.js');
    const config = await createConfig({
      auth: defineAppConfig({
        defaults: {},
        env: { SHARED_SECRET: envString('secret') },
      }),
      session: defineAppConfig({
        defaults: {},
        env: { SHARED_SECRET: envString('secret') },
      }),
    });

    await expect(
      config.loadSectionEnvironment({ SHARED_SECRET: 'value' }),
    ).rejects.toThrow(
      'Environment variable SHARED_SECRET is declared for both auth.secret and session.secret.',
    );
  });
});

describe('database connection options', () => {
  it('asks the dialect driver whether it accepts the options, without connecting', async () => {
    const { defineAppDatabaseConfig } =
      await import('../src/database/index.js');
    const { default: sqlite } = await import('@nocobase/db-sqlite');
    const config = await createConfig({
      database: defineAppDatabaseConfig(() => ({
        default: 'main',
        drivers: { sqlite },
        connections: {
          main: { dialect: 'sqlite', filename: ':memory:' },
          broken: {
            dialect: 'sqlite',
            filename: ':memory:',
            driverOptions: { filename: 'elsewhere.sqlite' },
          },
        },
      })),
    });

    expect(await config.validate()).toEqual([
      {
        level: 'error',
        path: 'database.connections.broken',
        message:
          'Database driverOptions cannot include filename. Use flattened connection parameters.',
      },
    ]);
  });
});
