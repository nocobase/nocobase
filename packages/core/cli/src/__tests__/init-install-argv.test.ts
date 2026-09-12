/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import Init from '../commands/init.js';

test('buildInstallArgv does not forward api-base-url for new installs', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
      lang: 'en-US',
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
      source: 'docker',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
      verbose: true,
    },
  );

  expect(argv).not.toContain('--api-base-url');
});

test('buildInstallArgv still forwards api-base-url for existing app setup', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'yes',
      appName: 'staging',
      apiBaseUrl: 'http://demo.example.com/api',
      authType: 'oauth',
    },
    {
      yes: true,
    },
  );

  expect(argv).toContain('--api-base-url');
  expect(argv).toContain('http://demo.example.com/api');
});

test('buildInstallArgv forwards db schema and db underscored for new installs', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
      source: 'docker',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
      dbSchema: 'test',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    },
    {
      yes: true,
      verbose: true,
    },
  );

  expect(argv).toContain('--db-schema');
  expect(argv).toContain('test');
  expect(argv).toContain('--db-table-prefix');
  expect(argv).toContain('nb_');
  expect(argv).toContain('--db-underscored');
});

test('buildInstallArgv forwards app public path for new installs', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appRootPath: './app7593/source/',
      appPort: '13000',
      appPublicPath: '/console/',
      storagePath: './app7593/storage/',
      source: 'docker',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
    },
  );

  expect(argv).toContain('--app-public-path');
  expect(argv).toContain('/console/');
});

test('buildInstallArgv forwards hook script for new installs', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'hook-script'?: string },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appPath: './app7593/',
      appPort: '13000',
      source: 'git',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
      'hook-script': './new-hook.mjs',
    },
  );

  expect(argv).toContain('--hook-script');
  expect(argv).toContain('./new-hook.mjs');
});

test('buildInstallArgv prefers --app-path and omits derived legacy path flags', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appPath: './app7593/',
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
      source: 'docker',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
    },
  );

  expect(argv).toContain('--app-path');
  expect(argv).toContain('./app7593/');
  expect(argv).not.toContain('--app-root-path');
  expect(argv).not.toContain('--storage-path');
});

test('buildInstallArgv omits equivalent legacy path flags with different separators', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appPath: './app7593/',
      appRootPath: '.\\app7593\\source',
      appPort: '13000',
      storagePath: './app7593/storage',
      source: 'docker',
      version: 'beta',
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
    },
  );

  expect(argv).toContain('--app-path');
  expect(argv).not.toContain('--app-root-path');
  expect(argv).not.toContain('--storage-path');
});

test('buildInstallArgv forwards --skip-download and omits download execution options', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'skip-download'?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      hasNocobase: 'no',
      appName: 'app7593',
      authType: 'oauth',
      lang: 'en-US',
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
      skipDownload: true,
      source: 'git',
      version: 'beta',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      npmRegistry: 'https://registry.npmmirror.com',
      outputDir: './app7593/source/',
      replace: true,
      builtinDb: true,
      dbDialect: 'postgres',
    },
    {
      yes: true,
      'skip-download': true,
    },
  );

  expect(argv).toContain('--skip-download');
  expect(argv).toContain('--source');
  expect(argv).toContain('git');
  expect(argv).toContain('--version');
  expect(argv).toContain('beta');
  expect(argv).toContain('--git-url');
  expect(argv).toContain('https://github.com/nocobase/nocobase.git');
  expect(argv).toContain('--npm-registry');
  expect(argv).toContain('https://registry.npmmirror.com');
  expect(argv).not.toContain('--output-dir');
  expect(argv).not.toContain('--replace');
});

test('buildInstallArgv keeps builtin db available and omits admin init args for manage-local setup', () => {
  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'skip-download'?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      setupMode: 'manage-local',
      appName: 'legacy-app',
      authType: 'oauth',
      lang: 'en-US',
      appRootPath: './legacy-app/source/',
      appPort: '13000',
      storagePath: './legacy-app/storage/',
      skipDownload: true,
      source: 'git',
      version: 'beta',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      outputDir: './legacy-app/source/',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbDatabase: 'legacy',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
    },
    {
      yes: true,
      'skip-download': true,
    },
  );

  expect(argv).not.toContain('--skip-download');
  expect(argv).toContain('--builtin-db');
  expect(argv).not.toContain('--no-builtin-db');
  expect(argv).toContain('--builtin-db-image');
  expect(argv).toContain('registry.example.com/postgres:16');
  expect(argv).not.toContain('--root-username');
  expect(argv).not.toContain('--root-email');
  expect(argv).not.toContain('--root-password');
  expect(argv).not.toContain('--root-nickname');
  expect(argv).toContain('--db-database');
  expect(argv).toContain('legacy');
});
