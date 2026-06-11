/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, expect, vi } from 'vitest';
import {
  clearEnvRootSetup,
  getEnv,
  getCurrentEnvName,
  loadAuthConfig,
  replaceEnvConfig,
  removeEnv,
  saveAuthConfig,
  setCurrentEnv,
  setEnvOauthSession,
  updateEnvConnection,
  upsertEnv,
} from '../lib/auth-store.js';
import {
  deleteCliConfigValue,
  getCliConfigValue,
  listExplicitCliConfigValues,
  setCliConfigValue,
} from '../lib/cli-config.js';
import { resolveCliHomeDir, resolveCliHomeRoot } from '../lib/cli-home.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-test-'));
  const tempWorkspace = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-root-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempWorkspace);
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
    await rm(tempWorkspace, { recursive: true, force: true });
  }
}

test('upsertEnv clears runtime metadata when base URL or token changes', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api', accessToken: 'new-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.auth?.accessToken).toBe('new-token');
    expect(env?.runtime).toBe(undefined);
  });
});

test('clearEnvRootSetup removes saved root setup fields while preserving other env settings', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            authType: 'token',
            auth: {
              type: 'token',
              accessToken: 'token-123',
            },
            dbDatabase: 'nocobase',
            rootUsername: 'admin',
            rootEmail: 'admin@nocobase.com',
            rootPassword: 'admin123',
            rootNickname: 'Admin',
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    const removed = await clearEnvRootSetup('test', { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(removed).toBe(true);
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
    expect(env?.authType).toBe('token');
    expect(env?.auth?.type).toBe('token');
    expect(env?.auth?.accessToken).toBe('token-123');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
    expect(env).not.toHaveProperty('rootUsername');
    expect(env).not.toHaveProperty('rootEmail');
    expect(env).not.toHaveProperty('rootPassword');
    expect(env).not.toHaveProperty('rootNickname');
  });
});

test('getCurrentEnvName prefers the current session env over lastEnv', async () => {
  await withTempCliHome(async () => {
    process.env.NB_SESSION_ID = 'test-session';
    try {
      await saveAuthConfig(
        {
          lastEnv: 'app2',
          envs: {
            app1: {
              baseUrl: 'http://localhost:13001/api',
            },
            app2: {
              baseUrl: 'http://localhost:13002/api',
            },
          },
        },
        { scope: 'global' },
      );

      await setCurrentEnv('app1', { scope: 'global' });

      expect(await getCurrentEnvName({ scope: 'global' })).toBe('app1');

      const config = await loadAuthConfig({ scope: 'global' });
      expect(config.lastEnv).toBe('app1');
    } finally {
      delete process.env.NB_SESSION_ID;
    }
  });
});

test('removeEnv repairs the current session env when removing the active env', async () => {
  await withTempCliHome(async () => {
    process.env.NB_SESSION_ID = 'test-session';
    try {
      await saveAuthConfig(
        {
          lastEnv: 'legacy',
          envs: {
            legacy: {
              baseUrl: 'http://localhost:13001/api',
            },
            next: {
              baseUrl: 'http://localhost:13002/api',
            },
          },
        },
        { scope: 'global' },
      );

      await setCurrentEnv('legacy', { scope: 'global' });
      const removal = await removeEnv('legacy', { scope: 'global' });

      expect(removal).toMatchObject({
        removed: 'legacy',
        lastEnv: 'next',
        hasEnvs: true,
      });
      expect(await getCurrentEnvName({ scope: 'global' })).toBe('next');
    } finally {
      delete process.env.NB_SESSION_ID;
    }
  });
});

test('getCurrentEnvName lazily repairs an invalid session env by falling back to lastEnv', async () => {
  await withTempCliHome(async () => {
    process.env.NB_SESSION_ID = 'test-session';
    try {
      await saveAuthConfig(
        {
          lastEnv: 'next',
          envs: {
            next: {
              baseUrl: 'http://localhost:13002/api',
            },
          },
        },
        { scope: 'global' },
      );

      const sessionsDir = path.join(resolveCliHomeDir('global'), 'sessions');
      await mkdir(sessionsDir, { recursive: true });
      await writeFile(
        path.join(sessionsDir, 'test-session.json'),
        JSON.stringify(
          {
            currentEnv: 'missing-env',
            updatedAt: '2026-05-09T00:00:00.000Z',
          },
          null,
          2,
        ),
      );

      expect(await getCurrentEnvName({ scope: 'global' })).toBe('next');
      expect(JSON.parse(await readFile(path.join(sessionsDir, 'test-session.json'), 'utf8'))).toMatchObject({
        currentEnv: 'next',
      });
    } finally {
      delete process.env.NB_SESSION_ID;
    }
  });
});

test('cli config stores explicit settings under settings', async () => {
  await withTempCliHome(async () => {
    const first = await setCliConfigValue('docker.network', 'nocobase-team', { scope: 'global' });
    const second = await setCliConfigValue('docker.container-prefix', 'nb-team', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(first).toBe('nocobase-team');
    expect(second).toBe('nb-team');
    expect(config.settings).toEqual({
      docker: {
        network: 'nocobase-team',
        containerPrefix: 'nb-team',
      },
    });
    expect(config.envs).toEqual({});
  });
});

test('cli config stores explicit locale under settings', async () => {
  await withTempCliHome(async () => {
    const locale = await setCliConfigValue('locale', 'zh', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(locale).toBe('zh-CN');
    expect(config.settings?.locale).toBe('zh-CN');
  });
});

test('cli config stores explicit binary overrides under settings', async () => {
  await withTempCliHome(async () => {
    const dockerBin = await setCliConfigValue('bin.docker', '/usr/local/bin/docker', { scope: 'global' });
    const caddyBin = await setCliConfigValue('bin.caddy', '/usr/bin/caddy', { scope: 'global' });
    const gitBin = await setCliConfigValue('bin.git', '/usr/bin/git', { scope: 'global' });
    const nginxBin = await setCliConfigValue('bin.nginx', '/usr/sbin/nginx', { scope: 'global' });
    const yarnBin = await setCliConfigValue('bin.yarn', 'yarn-custom', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(dockerBin).toBe('/usr/local/bin/docker');
    expect(caddyBin).toBe('/usr/bin/caddy');
    expect(gitBin).toBe('/usr/bin/git');
    expect(nginxBin).toBe('/usr/sbin/nginx');
    expect(yarnBin).toBe('yarn-custom');
    expect(config.settings).toEqual({
      bin: {
        docker: '/usr/local/bin/docker',
        caddy: '/usr/bin/caddy',
        git: '/usr/bin/git',
        nginx: '/usr/sbin/nginx',
        yarn: 'yarn-custom',
      },
    });
  });
});

test('cli config stores explicit proxy path settings under settings', async () => {
  await withTempCliHome(async () => {
    const nbCliRoot = await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
    const caddyDriver = await setCliConfigValue('proxy.caddy-driver', 'docker', { scope: 'global' });
    const host = await setCliConfigValue('proxy.upstream-host', 'host.docker.internal', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(nbCliRoot).toBe('/workspace');
    expect(caddyDriver).toBe('docker');
    expect(host).toBe('host.docker.internal');
    expect(config.settings?.proxy).toEqual({
      nbCliRoot: '/workspace',
      caddyDriver: 'docker',
      upstreamHost: 'host.docker.internal',
    });
  });
});

test('cli config stores explicit log retention settings under settings', async () => {
  await withTempCliHome(async () => {
    const retentionDays = await setCliConfigValue('log.retention-days', '21', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(retentionDays).toBe('21');
    expect(config.settings?.log).toEqual({
      retentionDays: 21,
    });
  });
});

test('cli config stores explicit log enabled settings under settings', async () => {
  await withTempCliHome(async () => {
    const enabled = await setCliConfigValue('log.enabled', 'false', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(enabled).toBe('false');
    expect(config.settings?.log).toEqual({
      enabled: false,
    });
  });
});

test('loadAuthConfig maps the legacy dockerResourcePrefix field to workspace name', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        dockerResourcePrefix: 'nb-legacy',
        lastEnv: 'default',
        envs: {},
      } as Parameters<typeof saveAuthConfig>[0] & { dockerResourcePrefix: string },
      { scope: 'global' },
    );

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.name).toBe('nb-legacy');
  });
});

test('cli config reads docker defaults from legacy name when explicit settings are missing', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        name: 'nb-legacy',
        lastEnv: 'default',
        envs: {},
      },
      { scope: 'global' },
    );

    expect(await getCliConfigValue('docker.network', { scope: 'global' })).toBe('nb-legacy');
    expect(await getCliConfigValue('docker.container-prefix', { scope: 'global' })).toBe('nb-legacy');
  });
});

test('cli config list and delete only affect explicit settings', async () => {
  await withTempCliHome(async () => {
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });
    await setCliConfigValue('license.pkg-url', 'https://pkg.example.com', { scope: 'global' });
    await setCliConfigValue('docker.network', 'nocobase-team', { scope: 'global' });
    await setCliConfigValue('bin.docker', '/usr/local/bin/docker', { scope: 'global' });
    await setCliConfigValue('bin.caddy', '/usr/bin/caddy', { scope: 'global' });
    await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
    await setCliConfigValue('proxy.upstream-host', 'host.docker.internal', { scope: 'global' });
    await setCliConfigValue('log.enabled', 'false', { scope: 'global' });
    await setCliConfigValue('log.retention-days', '30', { scope: 'global' });

    expect(await listExplicitCliConfigValues({ scope: 'global' })).toEqual({
      locale: 'zh-CN',
      'license.pkg-url': 'https://pkg.example.com/',
      'docker.network': 'nocobase-team',
      'bin.docker': '/usr/local/bin/docker',
      'bin.caddy': '/usr/bin/caddy',
      'proxy.nb-cli-root': '/workspace',
      'proxy.upstream-host': 'host.docker.internal',
      'log.enabled': 'false',
      'log.retention-days': '30',
    });

    expect(await deleteCliConfigValue('locale', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('docker.container-prefix', { scope: 'global' })).toBe(false);
    expect(await deleteCliConfigValue('docker.network', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('bin.docker', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('bin.caddy', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('proxy.nb-cli-root', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('proxy.upstream-host', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('log.enabled', { scope: 'global' })).toBe(true);
    expect(await deleteCliConfigValue('log.retention-days', { scope: 'global' })).toBe(true);
    expect(await listExplicitCliConfigValues({ scope: 'global' })).toEqual({
      'license.pkg-url': 'https://pkg.example.com/',
    });
  });
});

test('cli config returns default binary names when bin overrides are not configured', async () => {
  await withTempCliHome(async () => {
    expect(await getCliConfigValue('bin.docker', { scope: 'global' })).toBe('docker');
    expect(await getCliConfigValue('bin.caddy', { scope: 'global' })).toBe('caddy');
    expect(await getCliConfigValue('bin.git', { scope: 'global' })).toBe('git');
    expect(await getCliConfigValue('bin.nginx', { scope: 'global' })).toBe('nginx');
    expect(await getCliConfigValue('bin.yarn', { scope: 'global' })).toBe('yarn');
  });
});

test('cli config returns default proxy path settings', async () => {
  await withTempCliHome(async () => {
    expect(await getCliConfigValue('proxy.nb-cli-root', { scope: 'global' })).toBe(resolveCliHomeRoot());
    expect(await getCliConfigValue('proxy.nginx-driver', { scope: 'global' })).toBe('local');
    expect(await getCliConfigValue('proxy.upstream-host', { scope: 'global' })).toBe('127.0.0.1');
  });
});

test('cli config returns default log retention days', async () => {
  await withTempCliHome(async () => {
    expect(await getCliConfigValue('log.retention-days', { scope: 'global' })).toBe('14');
  });
});

test('cli config returns default log enabled state', async () => {
  await withTempCliHome(async () => {
    expect(await getCliConfigValue('log.enabled', { scope: 'global' })).toBe('true');
  });
});

test('cli config locale can be overridden by NB_LOCALE', async () => {
  await withTempCliHome(async () => {
    const previousLocale = process.env.NB_LOCALE;
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });
    process.env.NB_LOCALE = 'en-US';

    try {
      expect(await getCliConfigValue('locale', { scope: 'global' })).toBe('en-US');
    } finally {
      if (previousLocale === undefined) {
        delete process.env.NB_LOCALE;
      } else {
        process.env.NB_LOCALE = previousLocale;
      }
    }
  });
});

test('loadAuthConfig ignores legacy project envs and keeps global settings only', async () => {
  const previousRoot = process.env.NB_CLI_ROOT;
  const globalHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-global-home-'));
  const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);
  const homedirSpy = vi.spyOn(os, 'homedir').mockReturnValue(globalHome);

  delete process.env.NB_CLI_ROOT;

  try {
    const legacyConfigFile = path.join(workspaceDir, '.nocobase', 'config.json');
    await mkdir(path.dirname(legacyConfigFile), { recursive: true });
    await writeFile(
      legacyConfigFile,
      JSON.stringify(
        {
          currentEnv: 'legacy',
          envs: {
            legacy: {
              source: 'docker',
            },
          },
        },
        null,
        2,
      ),
    );
    await setCliConfigValue('docker.network', 'nocobase-team', { scope: 'global' });
    await setCliConfigValue('docker.container-prefix', 'nb-team', { scope: 'global' });

    const config = await loadAuthConfig({ scope: 'global' });
    const globalConfigFile = path.join(globalHome, '.nocobase', 'config.json');

    expect(config.lastEnv).toBe('default');
    expect(config.envs).toEqual({});
    expect(config.settings).toEqual({
      docker: {
        network: 'nocobase-team',
        containerPrefix: 'nb-team',
      },
    });
    expect(JSON.parse(await readFile(globalConfigFile, 'utf8'))).toMatchObject({
      lastEnv: 'default',
      envs: {},
      settings: {
        docker: {
          network: 'nocobase-team',
          containerPrefix: 'nb-team',
        },
      },
    });
    expect(JSON.parse(await readFile(legacyConfigFile, 'utf8'))).toMatchObject({
      currentEnv: 'legacy',
      envs: {
        legacy: {
          source: 'docker',
        },
      },
    });
  } finally {
    cwdSpy.mockRestore();
    homedirSpy.mockRestore();
    if (previousRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousRoot;
    }
    await rm(globalHome, { recursive: true, force: true });
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

test('upsertEnv preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'same-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api', accessToken: 'same-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('upsertEnv allows saving an env without a token', async () => {
  await withTempCliHome(async () => {
    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
    expect(env?.auth).toBe(undefined);
    expect(env?.appRootPath).toBe(resolveCliHomeRoot());
    expect(env?.storagePath).toBe(resolveCliHomeRoot());
  });
});

test('env relative paths resolve from NB_CLI_ROOT when provided', async () => {
  await withTempCliHome(async () => {
    const envRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-env-root-'));
    process.env.NB_CLI_ROOT = envRoot;

    try {
      await saveAuthConfig(
        {
          lastEnv: 'test',
          envs: {
            test: {
              appRootPath: './apps/test',
              storagePath: './storage/test',
            },
          },
        },
        { scope: 'global' },
      );

      const env = await getEnv('test', { scope: 'global' });
      expect(env?.appRootPath).toBe(path.resolve(envRoot, './apps/test'));
      expect(env?.storagePath).toBe(path.resolve(envRoot, './storage/test'));
    } finally {
      await rm(envRoot, { recursive: true, force: true });
    }
  });
});

test('legacy remote kind is normalized to http when loading env config', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'remote',
        envs: {
          remote: {
            kind: 'remote' as any,
            baseUrl: 'https://demo.example.com/api',
          },
        },
      },
      { scope: 'global' },
    );

    const env = await getEnv('remote', { scope: 'global' });
    expect(env?.kind).toBe('http');
  });
});

test('normalized kind is persisted to config.json', async () => {
  await withTempCliHome(async () => {
    await upsertEnv(
      'app1',
      {
        kind: 'remote',
        baseUrl: 'https://demo.example.com/api',
      },
      { scope: 'global' },
    );

    const content = await readFile(path.join(resolveCliHomeDir('global'), 'config.json'), 'utf8');
    const parsed = JSON.parse(content) as {
      envs?: Record<string, { kind?: string; apiBaseUrl?: string; baseUrl?: string }>;
    };

    expect(parsed.envs?.app1?.kind).toBe('http');
    expect(parsed.envs?.app1?.apiBaseUrl).toBe('https://demo.example.com/api');
    expect(parsed.envs?.app1?.baseUrl).toBe(undefined);
  });
});

test('upsertEnv clears an OAuth session when the base URL changes', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'oauth-token',
              refreshToken: 'refresh-token',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:14000/api' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:14000/api');
    expect(env?.auth).toBe(undefined);
  });
});

test('updateEnvConnection updates only the token and preserves the current base URL', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await updateEnvConnection('test', { accessToken: 'new-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
    expect(env?.authType).toBe('token');
    expect(env?.auth?.accessToken).toBe('new-token');
    expect(env?.runtime).toBe(undefined);
  });
});

test('updateEnvConnection preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'same-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await updateEnvConnection('test', { accessToken: 'same-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.authType).toBe('token');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('replaceEnvConfig preserves runtime metadata when only saved app settings change', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            apiBaseUrl: 'http://localhost:13000/api',
            authType: 'token',
            auth: {
              type: 'token',
              accessToken: 'same-token',
            },
            appPort: '13000',
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await replaceEnvConfig(
      'test',
      {
        kind: 'http',
        apiBaseUrl: 'http://localhost:13000/api',
        authType: 'token',
        accessToken: 'same-token',
        appPort: '14000',
      },
      { scope: 'global' },
    );

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.appPort).toBe('14000');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('replaceEnvConfig can remove a saved token while keeping token auth type', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            apiBaseUrl: 'http://localhost:13000/api',
            authType: 'token',
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await replaceEnvConfig(
      'test',
      {
        kind: 'http',
        apiBaseUrl: 'http://localhost:13000/api',
        authType: 'token',
      },
      { scope: 'global' },
    );

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.authType).toBe('token');
    expect(env?.auth).toBe(undefined);
    expect(env?.runtime).toBe(undefined);
  });
});

test('setEnvOauthSession can preserve runtime metadata during token refresh', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'old-access-token',
              refreshToken: 'refresh-token',
              expiresAt: '2026-04-13T00:00:00.000Z',
              scope: 'openid api offline_access',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await setEnvOauthSession(
      'test',
      {
        type: 'oauth',
        accessToken: 'new-access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2026-04-14T00:00:00.000Z',
        scope: 'openid api offline_access',
        issuer: 'http://localhost:13000/api',
        clientId: 'client-1',
        resource: 'http://localhost:13000/api/',
      },
      { scope: 'global', preserveRuntime: true },
    );

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.authType).toBe('oauth');
    expect(env?.auth?.type).toBe('oauth');
    expect(env?.auth?.accessToken).toBe('new-access-token');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('updateEnvConnection can switch an env to token auth without preserving an oauth session', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            authType: 'oauth',
            auth: {
              type: 'oauth',
              accessToken: 'oauth-access-token',
              refreshToken: 'refresh-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await updateEnvConnection('test', { authType: 'token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.authType).toBe('token');
    expect(env?.auth).toBe(undefined);
    expect(env?.runtime).toBe(undefined);
  });
});

test('loadAuthConfig ignores legacy project config when global config is empty', async () => {
  const previousRoot = process.env.NB_CLI_ROOT;
  const globalHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-global-home-'));
  const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);
  const homedirSpy = vi.spyOn(os, 'homedir').mockReturnValue(globalHome);

  delete process.env.NB_CLI_ROOT;

  try {
    const legacyConfigFile = path.join(workspaceDir, '.nocobase', 'config.json');
    await mkdir(path.dirname(legacyConfigFile), { recursive: true });
    await writeFile(
      legacyConfigFile,
      JSON.stringify(
        {
          currentEnv: 'legacy',
          envs: {
            legacy: {
              baseUrl: 'http://localhost:13000/api',
            },
          },
        },
        null,
        2,
      ),
    );

    const config = await loadAuthConfig({ scope: 'global' });
    const currentEnv = await getCurrentEnvName({ scope: 'global' });
    const env = await getEnv(undefined, { scope: 'global' });

    expect(config.lastEnv).toBe('default');
    expect(config.envs).toEqual({});
    expect(currentEnv).toBe('default');
    expect(env).toBe(undefined);
    await expect(readFile(path.join(globalHome, '.nocobase', 'config.json'), 'utf8')).rejects.toThrow();
    expect(JSON.parse(await readFile(legacyConfigFile, 'utf8'))).toMatchObject({
      currentEnv: 'legacy',
      envs: {
        legacy: {
          baseUrl: 'http://localhost:13000/api',
        },
      },
    });
  } finally {
    cwdSpy.mockRestore();
    homedirSpy.mockRestore();
    if (previousRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousRoot;
    }
    await rm(globalHome, { recursive: true, force: true });
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

test('legacy baseUrl key is still readable but normalized to apiBaseUrl when loading config', async () => {
  await withTempCliHome(async () => {
    const configFile = path.join(resolveCliHomeDir('global'), 'config.json');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(
      configFile,
      JSON.stringify(
        {
          currentEnv: 'legacy',
          envs: {
            legacy: {
              baseUrl: 'http://localhost:13000/api',
            },
          },
        },
        null,
        2,
      ),
    );

    const config = await loadAuthConfig({ scope: 'global' });
    const env = await getEnv('legacy', { scope: 'global' });

    expect(config.envs.legacy?.apiBaseUrl).toBe('http://localhost:13000/api');
    expect(config.envs.legacy?.baseUrl).toBe(undefined);
    expect(env?.apiBaseUrl).toBe('http://localhost:13000/api');
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
  });
});

test('write operations only affect global config and ignore legacy project envs', async () => {
  await withTempCliHome(async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    try {
      const legacyConfigPath = path.join(workspaceDir, '.nocobase', 'config.json');
      await mkdir(path.dirname(legacyConfigPath), { recursive: true });
      await writeFile(
        legacyConfigPath,
        JSON.stringify(
          {
            currentEnv: 'legacy',
            envs: {
              legacy: {
                baseUrl: 'http://localhost:13000/api',
                auth: {
                  type: 'token',
                  accessToken: 'old-token',
                },
              },
            },
          },
          null,
          2,
        ),
      );

      await expect(
        updateEnvConnection('legacy', { accessToken: 'new-token' }, { scope: 'global' }),
      ).resolves.toBeUndefined();
      await expect(setCurrentEnv('legacy', { scope: 'global' })).resolves.toBeUndefined();

      const globalConfig = await loadAuthConfig({ scope: 'global' });
      expect(globalConfig.lastEnv).toBe('legacy');
      expect(globalConfig.envs.legacy).toEqual({
        authType: 'token',
        auth: {
          type: 'token',
          accessToken: 'new-token',
        },
        kind: 'http',
      });
      expect(JSON.parse(await readFile(legacyConfigPath, 'utf8'))).toMatchObject({
        currentEnv: 'legacy',
        envs: {
          legacy: {
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
          },
        },
      });

      const removal = await removeEnv('legacy', { scope: 'global' });
      expect(removal.removed).toBe('legacy');
    } finally {
      cwdSpy.mockRestore();
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});
