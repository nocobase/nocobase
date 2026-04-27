/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';
import Download, { defaultDockerRegistryForLang } from '../commands/download.js';
import Init from '../commands/init.js';
import EnvAdd from '../commands/env/add.js';
import Install from '../commands/install.js';
import { saveAuthConfig } from '../lib/auth-store.js';
import { resolveLocalizedText } from '../lib/cli-locale.js';
import { runPromptCatalog } from '../lib/prompt-catalog.js';
import {
  findAvailableTcpPort,
  validateApiBaseUrl,
  validateAvailableTcpPort,
  validateTcpPort,
  validateEnvKey,
} from '../lib/prompt-validators.js';

async function withTempProjectCwd(run: () => Promise<void>) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-project-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    await rm(tempRoot, { recursive: true, force: true });
  }
}

const originalNbLocale = process.env.NB_LOCALE;

beforeEach(() => {
  process.env.NB_LOCALE = 'en-US';
});

afterEach(() => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
    return;
  }
  process.env.NB_LOCALE = originalNbLocale;
});

test('validateApiBaseUrl accepts http and https URLs', () => {
  expect(validateApiBaseUrl('http://localhost:13000/api')).toBe(undefined);
  expect(validateApiBaseUrl('https://demo.example.com/api')).toBe(undefined);
});

test('validateApiBaseUrl rejects malformed URLs and unsupported schemes', () => {
  expect(validateApiBaseUrl('not a url') ?? '').toMatch(/Enter a valid URL/);
  expect(validateApiBaseUrl('ftp://example.com/api') ?? '').toMatch(/URL must start with http:\/\/ or https:\/\//);
});

test('validateEnvKey allows only letters and numbers', () => {
  expect(validateEnvKey('local01')).toBe(undefined);
  expect(validateEnvKey('local-dev') ?? '').toMatch(/letters and numbers only/i);
});

test('validateAvailableTcpPort rejects invalid and occupied ports', async () => {
  expect(await validateAvailableTcpPort('abc') ?? '').toMatch(/valid TCP port/i);

  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  expect(address && typeof address === 'object').toBeTruthy();
  expect(await validateAvailableTcpPort(String(address.port)) ?? '').toMatch(/already in use/i);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

test('findAvailableTcpPort returns a free TCP port', async () => {
  const port = await findAvailableTcpPort();
  expect(typeof port).toBe('string');
  expect(port).toMatch(/^\d+$/);
  expect(await validateAvailableTcpPort(port)).toBe(undefined);
});

test('validateTcpPort rejects invalid ports and accepts valid ones', () => {
  expect(validateTcpPort('abc') ?? '').toMatch(/valid TCP port/i);
  expect(validateTcpPort('70000') ?? '').toMatch(/valid TCP port/i);
  expect(validateTcpPort('5432')).toBe(undefined);
});

test('init and env add prompts validate apiBaseUrl', async () => {
  const appNamePrompt = Init.prompts.appName;
  const initPrompt = Init.prompts.apiBaseUrl;
  const envAddPrompt = EnvAdd.prompts.apiBaseUrl;

  expect(appNamePrompt.type).toBe('text');
  expect(appNamePrompt.initialValue).toBe(undefined);
  expect(appNamePrompt.yesInitialValue).toBe(undefined);
  expect(typeof appNamePrompt.validate).toBe('function');
  expect(await appNamePrompt.validate?.('local-dev', {}) ?? '').toMatch(/letters and numbers only/i);
  expect(initPrompt.type).toBe('text');
  expect(envAddPrompt.type).toBe('text');
  expect(typeof initPrompt.validate).toBe('function');
  expect(typeof envAddPrompt.validate).toBe('function');
  expect(initPrompt.validate?.('not-a-url', {}) ?? '').toMatch(/Enter a valid URL/);
  expect(envAddPrompt.validate?.('ftp://example.com/api', {}) ?? '').toMatch(/http:\/\/ or https:\/\//);
});

test('init appName validates global env name uniqueness', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    const appNamePrompt = Init.prompts.appName;
    expect(appNamePrompt.type).toBe('text');
    expect(await appNamePrompt.validate?.('local', {}) ?? '').toMatch(/already exists/i);
    expect(await appNamePrompt.validate?.('newapp', {})).toBe(undefined);
  });
});

test('init appName allows reusing a global env name when --force is set', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    const appNamePrompt = Init.prompts.appName;
    expect(appNamePrompt.type).toBe('text');
    const originalArgv = process.argv;
    process.argv = ['node', 'nb', 'init', '--force'];
    try {
      expect(await appNamePrompt.validate?.('local', {})).toBe(undefined);
    } finally {
      process.argv = originalArgv;
    }
  });
});

test('init --yes --env validates global env name uniqueness through preset values', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    await expect((() =>
        runPromptCatalog(
          {
            appName: Init.prompts.appName,
          },
          {
            yes: true,
            values: {
              appName: 'local',
            },
            hooks: {
              onMissingNonInteractive: (message: string) => {
                throw new Error(message);
              },
            },
          },
        ))()).rejects.toThrow(/already exists/i);
  });
});

test('install prompts expose the expected defaults and validators', () => {
  const envPrompt = Install.envPrompts.env;
  const appPortPrompt = Install.appPrompts.appPort;
  const builtinDbPrompt = Install.dbPrompts.builtinDb;
  const dbDialectPrompt = Install.dbPrompts.dbDialect;
  const builtinDbImagePrompt = Install.dbPrompts.builtinDbImage;
  const dbHostPrompt = Install.dbPrompts.dbHost;
  const dbPortPrompt = Install.dbPrompts.dbPort;
  const dbDatabasePrompt = Install.dbPrompts.dbDatabase;
  const dbUserPrompt = Install.dbPrompts.dbUser;
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;
  const rootUsernamePrompt = Install.rootUserPrompts.rootUsername;
  const rootEmailPrompt = Install.rootUserPrompts.rootEmail;
  const rootPasswordPrompt = Install.rootUserPrompts.rootPassword;
  const rootNicknamePrompt = Install.rootUserPrompts.rootNickname;

  expect(envPrompt.type).toBe('text');
  expect(envPrompt.initialValue).toBe(undefined);
  expect(envPrompt.yesInitialValue).toBe(undefined);
  expect(typeof envPrompt.validate).toBe('function');
  expect(envPrompt.validate?.('local-dev', {}) ?? '').toMatch(/letters and numbers only/i);

  expect(appPortPrompt.type).toBe('text');
  expect(appPortPrompt.initialValue).toBe(undefined);
  expect(appPortPrompt.yesInitialValue).toBe(undefined);
  expect(typeof appPortPrompt.validate).toBe('function');

  expect(builtinDbPrompt.type).toBe('boolean');
  expect(builtinDbPrompt.initialValue).toBe(true);
  expect(builtinDbPrompt.yesInitialValue).toBe(true);
  expect(builtinDbPrompt.validate?.(true, { dbDialect: 'kingbase' })).toBe(undefined);

  expect(dbDialectPrompt.type).toBe('select');
  expect(dbDialectPrompt.initialValue).toBe('postgres');
  expect(dbDialectPrompt.yesInitialValue).toBe('postgres');

  expect(dbHostPrompt.type).toBe('text');
  expect(typeof dbHostPrompt.initialValue).toBe('function');
  expect(dbHostPrompt.initialValue({ builtinDb: false })).toBe('127.0.0.1');
  expect(dbHostPrompt.initialValue({ builtinDb: true })).toBe('postgres');
  expect(dbHostPrompt.yesInitialValue).toBe('postgres');
  expect(typeof dbHostPrompt.hidden).toBe('function');
  expect(dbHostPrompt.hidden?.({ builtinDb: true })).toBe(true);
  expect(dbHostPrompt.hidden?.({ builtinDb: false })).toBe(false);

  expect(builtinDbImagePrompt.type).toBe('text');
  expect(typeof builtinDbImagePrompt.initialValue).toBe('function');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'postgres' })).toBe('postgres:16');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'mysql' })).toBe('mysql:8');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'mariadb' })).toBe('mariadb:11');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'kingbase' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
  );
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: false, dbDialect: 'postgres' })).toBe(true);
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: true, dbDialect: 'postgres' })).toBe(false);
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: true, dbDialect: 'kingbase' })).toBe(false);

  expect(dbPortPrompt.type).toBe('text');
  expect(typeof dbPortPrompt.initialValue).toBe('function');
  expect(typeof dbPortPrompt.validate).toBe('function');
  expect(dbPortPrompt.initialValue({ dbDialect: 'postgres' })).toBe('5432');
  expect(dbPortPrompt.initialValue({ dbDialect: 'mysql' })).toBe('3306');
  expect(dbPortPrompt.initialValue({ dbDialect: 'mariadb' })).toBe('3306');
  expect(dbPortPrompt.initialValue({ dbDialect: 'kingbase' })).toBe('54321');
  expect(dbPortPrompt.yesInitialValue).toBe(undefined);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'docker' })).toBe(true);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'npm' })).toBe(false);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'git' })).toBe(false);
  expect(dbPortPrompt.hidden?.({ builtinDb: false })).toBe(false);

  expect(dbDatabasePrompt.type).toBe('text');
  expect(typeof dbDatabasePrompt.initialValue).toBe('function');
  expect(dbDatabasePrompt.initialValue({ dbDialect: 'postgres' })).toBe('nocobase');
  expect(dbDatabasePrompt.initialValue({ dbDialect: 'kingbase' })).toBe('kingbase');
  expect(dbDatabasePrompt.yesInitialValue).toBe(undefined);

  expect(dbUserPrompt.type).toBe('text');
  expect(dbUserPrompt.initialValue).toBe('nocobase');
  expect(dbUserPrompt.yesInitialValue).toBe('nocobase');

  expect(dbPasswordPrompt.type).toBe('password');
  expect(dbPasswordPrompt.initialValue).toBe('nocobase');
  expect(dbPasswordPrompt.yesInitialValue).toBe('nocobase');

  expect(rootUsernamePrompt.type).toBe('text');
  expect(rootUsernamePrompt.initialValue).toBe(undefined);
  expect(rootUsernamePrompt.yesInitialValue).toBe('nocobase');
  expect(rootUsernamePrompt.required).toBe(true);

  expect(rootEmailPrompt.type).toBe('text');
  expect(rootEmailPrompt.initialValue).toBe(undefined);
  expect(rootEmailPrompt.yesInitialValue).toBe('admin@nocobase.com');
  expect(rootEmailPrompt.required).toBe(true);

  expect(rootPasswordPrompt.type).toBe('password');
  expect(resolveLocalizedText(rootPasswordPrompt.message, { locale: 'en-US' })).toBe('Choose the initial admin password');
  expect(rootPasswordPrompt.initialValue).toBe(undefined);
  expect(rootPasswordPrompt.yesInitialValue).toBe('admin123');
  expect(rootPasswordPrompt.required).toBe(true);

  expect(rootNicknamePrompt.type).toBe('text');
  expect(rootNicknamePrompt.initialValue).toBe(undefined);
  expect(rootNicknamePrompt.yesInitialValue).toBe('Super Admin');
  expect(rootNicknamePrompt.required).toBe(true);
});

test('docker registry defaults follow CLI locale', () => {
  const dockerRegistryPrompt = Download.prompts.dockerRegistry;
  const dockerPlatformPrompt = Download.prompts.dockerPlatform;

  expect(defaultDockerRegistryForLang('zh-CN')).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(defaultDockerRegistryForLang('en-US')).toBe('nocobase/nocobase');

  expect(dockerRegistryPrompt.type).toBe('text');
  process.env.NB_LOCALE = 'zh-CN';
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'en-US' })).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'zh-CN' })).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(dockerRegistryPrompt.initialValue?.({})).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  process.env.NB_LOCALE = 'en-US';
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'zh-CN' })).toBe('nocobase/nocobase');

  expect(dockerPlatformPrompt.type).toBe('select');
  expect(dockerPlatformPrompt.initialValue).toBe('auto');
  expect(dockerPlatformPrompt.yesInitialValue).toBe('auto');
  expect(dockerPlatformPrompt.hidden?.({ source: 'docker' })).toBe(false);
  expect(dockerPlatformPrompt.hidden?.({ source: 'npm' })).toBe(true);
});

test('docker registry placeholder follows locale copy', () => {
  const dockerRegistryPrompt = Download.prompts.dockerRegistry;

  expect(resolveLocalizedText(dockerRegistryPrompt.placeholder, { locale: 'en-US' })).toBe(
    'nocobase/nocobase',
  );
  expect(resolveLocalizedText(dockerRegistryPrompt.placeholder, { locale: 'zh-CN' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
});

test('version prompt uses presets and reveals otherVersion when needed', () => {
  const versionPrompt = Download.prompts.version;
  const otherVersionPrompt = Download.prompts.otherVersion;

  expect(versionPrompt.type).toBe('select');
  expect(versionPrompt.variant).toBe('radio');
  expect(versionPrompt.initialValue).toBe('beta');
  expect(versionPrompt.yesInitialValue).toBe('beta');
  expect(
    versionPrompt.options[0] && typeof versionPrompt.options[0] !== 'string'
      ? versionPrompt.options[0].disabled
      : undefined,
  ).toBe(true);
  expect(resolveLocalizedText(versionPrompt.options?.[0] && typeof versionPrompt.options[0] !== 'string' ? versionPrompt.options[0].hint : undefined, { locale: 'zh-CN' })).toContain('稳定版');
  expect(resolveLocalizedText(versionPrompt.options?.[1] && typeof versionPrompt.options[1] !== 'string' ? versionPrompt.options[1].hint : undefined, { locale: 'zh-CN' })).toContain('测试版');
  expect(resolveLocalizedText(versionPrompt.options?.[2] && typeof versionPrompt.options[2] !== 'string' ? versionPrompt.options[2].hint : undefined, { locale: 'zh-CN' })).toContain('开发版');
  expect(otherVersionPrompt.type).toBe('text');
  expect(otherVersionPrompt.hidden?.({ version: 'alpha' })).toBe(true);
  expect(otherVersionPrompt.hidden?.({ version: 'other' })).toBe(false);
});

test('builtin database image defaults follow NB_LOCALE', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { default: InstallWithZhLocale } = await import('../commands/install.js');
  const builtinDbImagePrompt = InstallWithZhLocale.dbPrompts.builtinDbImage;

  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'postgres' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
  );
  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'mysql' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/mysql:8',
  );
  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'mariadb' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/mariadb:11',
  );
});

test('install download prompt options follow CLI locale for docker registry defaults', () => {
  const installStatics = (
    Install as unknown as {
      buildDownloadPromptOptionsForInstall: (
        appResults: Record<string, unknown>,
        envName: string,
      ) => {
        initialValues: Record<string, unknown>;
        values: Record<string, unknown>;
      };
      buildDownloadPresetValuesForInstall: (
        flags: Record<string, unknown>,
        appResults: Record<string, unknown>,
        envName: string,
        yes: boolean,
      ) => Record<string, unknown>;
      buildPresetValuesFromFlags: (flags: Record<string, unknown>) => Record<string, unknown>;
    }
  );

  process.env.NB_LOCALE = 'zh-CN';
  const zhOptions = installStatics.buildDownloadPromptOptionsForInstall(
    {
      lang: 'en-US',
      appRootPath: './apps/zh-demo',
    },
    'zh-demo',
  );
  expect(zhOptions.initialValues.lang).toBe('en-US');
  expect(zhOptions.initialValues.dockerRegistry).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(zhOptions.initialValues.outputDir).toBe('./apps/zh-demo');
  expect(zhOptions.values.lang).toBe('en-US');

  process.env.NB_LOCALE = 'en-US';
  const enOptions = installStatics.buildDownloadPromptOptionsForInstall(
    {
      lang: 'zh-CN',
      appRootPath: './apps/en-demo',
    },
    'en-demo',
  );
  expect(enOptions.initialValues.lang).toBe('zh-CN');
  expect(enOptions.initialValues.dockerRegistry).toBe('nocobase/nocobase');
  expect(enOptions.values.lang).toBe('zh-CN');

  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'install', '--yes'];
  try {
    const preset = installStatics.buildDownloadPresetValuesForInstall(
      {
        yes: true,
        verbose: false,
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      true,
    );

    expect(preset.lang).toBe('en-US');
    expect(preset.source).toBe('docker');
    expect(preset.version).toBe('alpha');
    expect(preset.outputDir).toBe('./apps/en-demo');

    const refPreset = installStatics.buildDownloadPresetValuesForInstall(
      {
        version: 'next',
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      false,
    );
    expect(refPreset.version).toBe('other');
    expect(refPreset.otherVersion).toBe('next');

    const resumePreset = installStatics.buildDownloadPresetValuesForInstall(
      {
        resume: true,
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      false,
    );
    expect(resumePreset.replace).toBe(true);
  } finally {
    process.argv = originalArgv;
  }

  process.argv = ['node', 'nb', 'install', '--no-builtin-db'];
  try {
    const preset = installStatics.buildPresetValuesFromFlags({
      'builtin-db': false,
    });
    expect(preset.builtinDb).toBe(false);
  } finally {
    process.argv = originalArgv;
  }

  process.argv = ['node', 'nb', 'install', '--db-host', 'db.example.com'];
  try {
    const preset = installStatics.buildPresetValuesFromFlags({
      'builtin-db': true,
      'db-host': 'db.example.com',
    });
    expect(preset.dbHost).toBe('db.example.com');
    expect(preset.builtinDb).toBe(false);
  } finally {
    process.argv = originalArgv;
  }
});
