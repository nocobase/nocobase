/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { test, vi } from 'vitest';
import Download, { defaultDockerRegistryForLang } from '../commands/download.js';
import Init from '../commands/init.js';
import EnvAdd from '../commands/env/add.js';
import Install from '../commands/install.js';
import { saveAuthConfig } from '../lib/auth-store.js';
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

test('validateApiBaseUrl accepts http and https URLs', () => {
  assert.equal(validateApiBaseUrl('http://localhost:13000/api'), undefined);
  assert.equal(validateApiBaseUrl('https://demo.example.com/api'), undefined);
});

test('validateApiBaseUrl rejects malformed URLs and unsupported schemes', () => {
  assert.match(
    validateApiBaseUrl('not a url') ?? '',
    /Enter a valid URL/,
  );
  assert.match(
    validateApiBaseUrl('ftp://example.com/api') ?? '',
    /URL must start with http:\/\/ or https:\/\//,
  );
});

test('validateEnvKey allows only letters and numbers', () => {
  assert.equal(validateEnvKey('local01'), undefined);
  assert.match(validateEnvKey('local-dev') ?? '', /letters and numbers only/i);
});

test('validateAvailableTcpPort rejects invalid and occupied ports', async () => {
  assert.match(
    await validateAvailableTcpPort('abc') ?? '',
    /valid TCP port/i,
  );

  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  assert.match(
    await validateAvailableTcpPort(String(address.port)) ?? '',
    /already in use/i,
  );

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
  assert.equal(typeof port, 'string');
  assert.match(port, /^\d+$/);
  assert.equal(await validateAvailableTcpPort(port), undefined);
});

test('validateTcpPort rejects invalid ports and accepts valid ones', () => {
  assert.match(
    validateTcpPort('abc') ?? '',
    /valid TCP port/i,
  );
  assert.match(
    validateTcpPort('70000') ?? '',
    /valid TCP port/i,
  );
  assert.equal(validateTcpPort('5432'), undefined);
});

test('init and env add prompts validate apiBaseUrl', async () => {
  const appNamePrompt = Init.prompts.appName;
  const initPrompt = Init.prompts.apiBaseUrl;
  const envAddPrompt = EnvAdd.prompts.apiBaseUrl;

  assert.equal(appNamePrompt.type, 'text');
  assert.equal(appNamePrompt.initialValue, undefined);
  assert.equal(appNamePrompt.yesInitialValue, undefined);
  assert.equal(typeof appNamePrompt.validate, 'function');
  assert.match(await appNamePrompt.validate?.('local-dev', {}) ?? '', /letters and numbers only/i);
  assert.equal(initPrompt.type, 'text');
  assert.equal(envAddPrompt.type, 'text');
  assert.equal(typeof initPrompt.validate, 'function');
  assert.equal(typeof envAddPrompt.validate, 'function');
  assert.match(initPrompt.validate?.('not-a-url', {}) ?? '', /Enter a valid URL/);
  assert.match(envAddPrompt.validate?.('ftp://example.com/api', {}) ?? '', /http:\/\/ or https:\/\//);
});

test('init appName validates workspace env name uniqueness', async () => {
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
      { scope: 'project' },
    );

    const appNamePrompt = Init.prompts.appName;
    assert.equal(appNamePrompt.type, 'text');
    assert.match(await appNamePrompt.validate?.('local', {}) ?? '', /already exists/i);
    assert.equal(await appNamePrompt.validate?.('newapp', {}), undefined);
  });
});

test('init appName allows reusing a workspace env name when --force is set', async () => {
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
      { scope: 'project' },
    );

    const appNamePrompt = Init.prompts.appName;
    assert.equal(appNamePrompt.type, 'text');
    const originalArgv = process.argv;
    process.argv = ['node', 'nb', 'init', '--force'];
    try {
      assert.equal(await appNamePrompt.validate?.('local', {}), undefined);
    } finally {
      process.argv = originalArgv;
    }
  });
});

test('init --yes --env validates workspace env name uniqueness through preset values', async () => {
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
      { scope: 'project' },
    );

    await assert.rejects(
      () =>
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
        ),
      /already exists in this workspace/i,
    );
  });
});

test('install prompts expose the expected defaults and validators', () => {
  const envPrompt = Install.envPrompts.env;
  const appPortPrompt = Install.appPrompts.appPort;
  const builtinDbPrompt = Install.dbPrompts.builtinDb;
  const dbDialectPrompt = Install.dbPrompts.dbDialect;
  const dbHostPrompt = Install.dbPrompts.dbHost;
  const dbPortPrompt = Install.dbPrompts.dbPort;
  const dbDatabasePrompt = Install.dbPrompts.dbDatabase;
  const dbUserPrompt = Install.dbPrompts.dbUser;
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;
  const rootUsernamePrompt = Install.rootUserPrompts.rootUsername;
  const rootEmailPrompt = Install.rootUserPrompts.rootEmail;
  const rootPasswordPrompt = Install.rootUserPrompts.rootPassword;
  const rootNicknamePrompt = Install.rootUserPrompts.rootNickname;

  assert.equal(envPrompt.type, 'text');
  assert.equal(envPrompt.initialValue, undefined);
  assert.equal(envPrompt.yesInitialValue, undefined);
  assert.equal(typeof envPrompt.validate, 'function');
  assert.match(envPrompt.validate?.('local-dev', {}) ?? '', /letters and numbers only/i);

  assert.equal(appPortPrompt.type, 'text');
  assert.equal(appPortPrompt.initialValue, undefined);
  assert.equal(appPortPrompt.yesInitialValue, undefined);
  assert.equal(typeof appPortPrompt.validate, 'function');

  assert.equal(builtinDbPrompt.type, 'boolean');
  assert.equal(builtinDbPrompt.initialValue, true);
  assert.equal(builtinDbPrompt.yesInitialValue, true);

  assert.equal(dbDialectPrompt.type, 'select');
  assert.equal(dbDialectPrompt.initialValue, 'postgres');
  assert.equal(dbDialectPrompt.yesInitialValue, 'postgres');

  assert.equal(dbHostPrompt.type, 'text');
  assert.equal(typeof dbHostPrompt.initialValue, 'function');
  assert.equal(dbHostPrompt.initialValue({ builtinDb: false }), '127.0.0.1');
  assert.equal(dbHostPrompt.initialValue({ builtinDb: true }), 'postgres');
  assert.equal(dbHostPrompt.yesInitialValue, 'postgres');
  assert.equal(typeof dbHostPrompt.hidden, 'function');
  assert.equal(dbHostPrompt.hidden?.({ builtinDb: true }), true);
  assert.equal(dbHostPrompt.hidden?.({ builtinDb: false }), false);

  assert.equal(dbPortPrompt.type, 'text');
  assert.equal(typeof dbPortPrompt.initialValue, 'function');
  assert.equal(typeof dbPortPrompt.validate, 'function');
  assert.equal(dbPortPrompt.initialValue({ dbDialect: 'postgres' }), '5432');
  assert.equal(dbPortPrompt.initialValue({ dbDialect: 'mysql' }), '3306');
  assert.equal(dbPortPrompt.initialValue({ dbDialect: 'mariadb' }), '3306');
  assert.equal(dbPortPrompt.initialValue({ dbDialect: 'kingbase' }), '54321');
  assert.equal(dbPortPrompt.yesInitialValue, undefined);
  assert.equal(dbPortPrompt.hidden?.({ builtinDb: true, source: 'docker' }), true);
  assert.equal(dbPortPrompt.hidden?.({ builtinDb: true, source: 'npm' }), false);
  assert.equal(dbPortPrompt.hidden?.({ builtinDb: true, source: 'git' }), false);
  assert.equal(dbPortPrompt.hidden?.({ builtinDb: false }), false);

  assert.equal(dbDatabasePrompt.type, 'text');
  assert.equal(dbDatabasePrompt.initialValue, 'nocobase');
  assert.equal(dbDatabasePrompt.yesInitialValue, 'nocobase');

  assert.equal(dbUserPrompt.type, 'text');
  assert.equal(dbUserPrompt.initialValue, 'nocobase');
  assert.equal(dbUserPrompt.yesInitialValue, 'nocobase');

  assert.equal(dbPasswordPrompt.type, 'password');
  assert.equal(dbPasswordPrompt.initialValue, 'nocobase');
  assert.equal(dbPasswordPrompt.yesInitialValue, 'nocobase');

  assert.equal(rootUsernamePrompt.type, 'text');
  assert.equal(rootUsernamePrompt.initialValue, 'nocobase');
  assert.equal(rootUsernamePrompt.yesInitialValue, 'nocobase');

  assert.equal(rootEmailPrompt.type, 'text');
  assert.equal(rootEmailPrompt.initialValue, 'admin@example.com');
  assert.equal(rootEmailPrompt.yesInitialValue, 'admin@example.com');

  assert.equal(rootPasswordPrompt.type, 'password');
  assert.equal(rootPasswordPrompt.initialValue, 'admin123');
  assert.equal(rootPasswordPrompt.yesInitialValue, 'admin123');

  assert.equal(rootNicknamePrompt.type, 'text');
  assert.equal(rootNicknamePrompt.initialValue, 'Super Admin');
  assert.equal(rootNicknamePrompt.yesInitialValue, 'Super Admin');
});

test('docker image defaults follow app language', () => {
  const dockerRegistryPrompt = Download.prompts.dockerRegistry;
  const dockerPlatformPrompt = Download.prompts.dockerPlatform;

  assert.equal(defaultDockerRegistryForLang('zh-CN'), 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  assert.equal(defaultDockerRegistryForLang('en-US'), 'nocobase/nocobase');

  assert.equal(dockerRegistryPrompt.type, 'text');
  assert.equal(
    dockerRegistryPrompt.initialValue?.({ lang: 'zh-CN' }),
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
  assert.equal(
    dockerRegistryPrompt.initialValue?.({ lang: 'en-US' }),
    'nocobase/nocobase',
  );

  assert.equal(dockerPlatformPrompt.type, 'select');
  assert.equal(dockerPlatformPrompt.initialValue, 'auto');
  assert.equal(dockerPlatformPrompt.yesInitialValue, 'auto');
  assert.equal(dockerPlatformPrompt.hidden?.({ source: 'docker' }), false);
  assert.equal(dockerPlatformPrompt.hidden?.({ source: 'npm' }), true);
});

test('install download prompt options pass app language into docker image defaults', () => {
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
    }
  );

  const zhOptions = installStatics.buildDownloadPromptOptionsForInstall(
    {
      lang: 'zh-CN',
      appRootPath: './apps/zh-demo',
    },
    'zh-demo',
  );
  assert.equal(zhOptions.initialValues.lang, 'zh-CN');
  assert.equal(
    zhOptions.initialValues.dockerRegistry,
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
  assert.equal(zhOptions.initialValues.outputDir, './apps/zh-demo');
  assert.equal(zhOptions.values.lang, 'zh-CN');

  const enOptions = installStatics.buildDownloadPromptOptionsForInstall(
    {
      lang: 'en-US',
      appRootPath: './apps/en-demo',
    },
    'en-demo',
  );
  assert.equal(enOptions.initialValues.lang, 'en-US');
  assert.equal(enOptions.initialValues.dockerRegistry, 'nocobase/nocobase');
  assert.equal(enOptions.values.lang, 'en-US');

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

    assert.equal(preset.lang, 'en-US');
    assert.equal(preset.source, 'docker');
    assert.equal(preset.version, 'alpha');
    assert.equal(preset.outputDir, './apps/en-demo');
  } finally {
    process.argv = originalArgv;
  }
});
