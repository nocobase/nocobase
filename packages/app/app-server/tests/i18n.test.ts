import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';
import { environmentProvider, envString } from '@nocobase/config/providers/env';

import {
  Application,
  type ApplicationOptions,
} from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  type AppI18nConfig,
  i18nToken,
  I18nProvider,
} from '../src/i18n/index.js';
import { defineServerPlugin } from '../src/plugins/index.js';
import { spaRootRoutes } from '../src/spa/index.js';

const applicationLocales = {
  'en-US': () => Promise.resolve({ default: { greeting: 'Hello' } }),
  'zh-CN': () => Promise.resolve({ default: { greeting: '你好' } }),
};

/** A plugin translating a language the application itself does not offer. */
const pluginLocales = {
  'en-US': () => Promise.resolve({ default: { plugin: 'Plugin' } }),
  'ja-JP': () => Promise.resolve({ default: { plugin: 'プラグイン' } }),
};

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('i18n config', () => {
  it('defaults to en-US and declares no locale list', async () => {
    const config = await createAppConfig();

    expect(config.get<AppI18nConfig>('i18n')).toEqual({
      defaultLocale: 'en-US',
    });
  });

  it('reads the default locale from APP_DEFAULT_LOCALE', async () => {
    const config = await createAppConfig({ APP_DEFAULT_LOCALE: 'zh-CN' });

    expect(config.get<string>('i18n.defaultLocale')).toBe('zh-CN');
  });
});

describe('application locales', () => {
  it('offers the languages the application declares, not the ones a plugin adds', async () => {
    const app = await startApplication();

    const runtime = app.container.resolve(i18nToken);
    expect(runtime.getLocales()).toEqual(['en-US', 'zh-CN']);
    // The plugin's translations still reach the languages the application does offer.
    expect(runtime.getFixedT('@nocobase/app-plugin-test')('plugin')).toBe(
      'Plugin',
    );

    await app.shutdown();
  });

  it('keeps the configured default on offer when the application does not declare it', async () => {
    const app = await startApplication({ APP_DEFAULT_LOCALE: 'fr-FR' });

    const runtime = app.container.resolve(i18nToken);
    expect(runtime.getDefaultLocale()).toBe('fr-FR');
    expect(runtime.getLocales()).toContain('fr-FR');

    await app.shutdown();
  });

  it('resolves a requested locale against the application list alone', async () => {
    const app = await startApplication();

    const runtime = app.container.resolve(i18nToken);
    expect(runtime.resolveLocale('zh-CN')).toBe('zh-CN');
    expect(runtime.resolveLocale('ja-JP')).toBe('en-US');

    await app.shutdown();
  });

  it('accepts the locales module itself as well as a function importing it', async () => {
    const app = await startApplication({}, { localesForm: 'module' });

    const runtime = app.container.resolve(i18nToken);
    expect(runtime.getLocales()).toEqual(['en-US', 'zh-CN']);
    expect(runtime.getFixedT('@nocobase/app-plugin-test')('plugin')).toBe(
      'Plugin',
    );

    await app.shutdown();
  });

  it('offers only the default when the application declares no locales', async () => {
    const app = await startApplication({}, { withApplicationLocales: false });

    expect(app.container.resolve(i18nToken).getLocales()).toEqual(['en-US']);

    await app.shutdown();
  });
});

describe('the default locale published to the browser', () => {
  it('reaches the client config, so both sides read one value', async () => {
    const config = await createSpaAppConfig({ APP_DEFAULT_LOCALE: 'zh-CN' });

    const html = await fetchSpaIndex(config);

    expect(html).toContain('"i18n":{"defaultLocale":"zh-CN"}');
    expect(html).toContain('<html lang="zh-CN">');
  });

  it('is omitted when the application registers no i18n config', async () => {
    const config = await createSpaAppConfig({}, { withI18nConfig: false });

    const html = await fetchSpaIndex(config);

    expect(html).not.toContain('"i18n"');
    expect(html).toContain('<html lang="en-US">');
  });
});

describe('the application identity published to the browser', () => {
  it("reads the name and version from the application's package.json", async () => {
    const config = await createSpaAppConfig();

    const html = await fetchSpaIndex(config, {
      name: '@example/crm',
      displayName: 'CRM',
      version: '1.2.3',
    });

    expect(html).toContain('"app":{"displayName":"CRM","version":"1.2.3"}');
  });

  it('publishes nothing about the application without a package.json', async () => {
    const config = await createSpaAppConfig();

    const html = await fetchSpaIndex(config);

    expect(html).not.toContain('"displayName"');
  });
});

async function fetchSpaIndex(
  config: AppConfig,
  appPackage?: Record<string, unknown>,
): Promise<string> {
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-spa-'));
  temporaryDirectories.push(root);
  writeFileSync(path.join(root, 'index.html'), '<main></main>', 'utf8');
  if (appPackage) {
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify(appPackage),
      'utf8',
    );
  }

  const router = new Hono();
  router.route(
    '/',
    spaRootRoutes.createRouter({
      config,
      mode: 'standalone',
      publicBasePath: '/main',
      paths: { rootDir: root },
    }),
  );

  const response = await router.request('http://localhost/main');
  return response.text();
}

async function createSpaAppConfig(
  environment: Readonly<Record<string, string>> = {},
  options: { readonly withI18nConfig?: boolean } = {},
): Promise<AppConfig> {
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-spa-index-'));
  temporaryDirectories.push(root);
  writeFileSync(
    path.join(root, 'index.html'),
    '<html lang="en-US"><main></main></html>',
    'utf8',
  );

  const config = new AppConfig();
  config.load(
    environmentProvider(environment, {
      mappings: { APP_DEFAULT_LOCALE: envString('i18n.defaultLocale') },
    }),
  );
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'main',
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
    },
    ...(options.withI18nConfig === false
      ? {}
      : { i18n: { defaultLocale: 'en-US' } }),
    spa: {
      indexPath: path.join(root, 'index.html'),
    },
  });
  return config;
}

async function startApplication(
  environment: Readonly<Record<string, string>> = {},
  options: {
    readonly withApplicationLocales?: boolean;
    readonly localesForm?: 'loader' | 'module';
  } = {},
): Promise<Application> {
  const asModule = options.localesForm === 'module';
  const app = new Application(await createTestApplicationOptions(environment));
  app.addServiceProvider(I18nProvider);
  app.addRuntimeContributions({
    plugins: {
      appPackageName: '@nocobase/app-test',
      plugins: [
        {
          definition: defineServerPlugin({
            baseDir: import.meta.dirname,
            packageName: '@nocobase/app-plugin-test',
            locales: asModule
              ? pluginLocales
              : () => Promise.resolve(pluginLocales),
          }),
          metadata: {
            packageName: '@nocobase/app-plugin-test',
            version: 'test',
            rootDir: '/test/plugins/test',
            baseDir: '/test/plugins/test',
            jobLocations: [],
          },
        },
      ],
    },
    serviceProviders: [],
    routes: [],
    locales:
      options.withApplicationLocales === false
        ? undefined
        : asModule
          ? applicationLocales
          : () => Promise.resolve(applicationLocales),
  });
  await app.start();
  return app;
}

async function createAppConfig(
  environment: Readonly<Record<string, string>> = {},
): Promise<AppConfig> {
  const config = new AppConfig();
  config.load(
    environmentProvider(environment, {
      mappings: { APP_DEFAULT_LOCALE: envString('i18n.defaultLocale') },
    }),
  );
  await config.loadAll();
  config.mergeDefaults({ i18n: { defaultLocale: 'en-US' } });
  return config;
}

async function createTestApplicationOptions(
  environment: Readonly<Record<string, string>>,
): Promise<ApplicationOptions> {
  const config = new AppConfig();
  config.load(
    environmentProvider(environment, {
      mappings: { APP_DEFAULT_LOCALE: envString('i18n.defaultLocale') },
    }),
  );
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'main',
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
    },
    i18n: { defaultLocale: 'en-US' },
  });

  return { config, paths: createAppPaths({ rootDir: '/test/app' }) };
}
