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
  ensureWorkspaceName,
  getEnv,
  getCurrentEnvName,
  loadAuthConfig,
  removeEnv,
  saveAuthConfig,
  setCurrentEnv,
  setEnvOauthSession,
  updateEnvConnection,
  upsertEnv,
} from '../lib/auth-store.js';
import { resolveCliHomeDir, resolveCliHomeRoot } from '../lib/cli-home.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NOCOBASE_CTL_HOME;
  const previousEnvRoot = process.env.NB_ENV_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-test-'));
  process.env.NOCOBASE_CTL_HOME = tempHome;
  delete process.env.NB_ENV_ROOT;

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.NOCOBASE_CTL_HOME;
    } else {
      process.env.NOCOBASE_CTL_HOME = previous;
    }
    if (previousEnvRoot === undefined) {
      delete process.env.NB_ENV_ROOT;
    } else {
      process.env.NB_ENV_ROOT = previousEnvRoot;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

test('upsertEnv clears runtime metadata when base URL or token changes', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
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

test('ensureWorkspaceName stores one workspace-level name outside env entries', async () => {
  await withTempCliHome(async () => {
    const first = await ensureWorkspaceName('nb-workspace', { scope: 'global' });
    const second = await ensureWorkspaceName('nb-other', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(first).toBe('nb-workspace');
    expect(second).toBe('nb-workspace');
    expect(config.name).toBe('nb-workspace');
    expect(config.envs).toEqual({});
  });
});

test('loadAuthConfig maps the legacy dockerResourcePrefix field to workspace name', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        dockerResourcePrefix: 'nb-legacy',
        currentEnv: 'default',
        envs: {},
      } as Parameters<typeof saveAuthConfig>[0] & { dockerResourcePrefix: string },
      { scope: 'global' },
    );

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.name).toBe('nb-legacy');
  });
});

test('upsertEnv preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
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

test('env relative paths resolve from NB_ENV_ROOT when provided', async () => {
  await withTempCliHome(async () => {
    const envRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-env-root-'));
    process.env.NB_ENV_ROOT = envRoot;

    try {
      await saveAuthConfig(
        {
          currentEnv: 'test',
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
        currentEnv: 'remote',
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
        currentEnv: 'test',
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
        currentEnv: 'test',
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
    expect(env?.auth?.accessToken).toBe('new-token');
    expect(env?.runtime).toBe(undefined);
  });
});

test('updateEnvConnection preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
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
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('setEnvOauthSession can preserve runtime metadata during token refresh', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
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
    expect(env?.auth?.type).toBe('oauth');
    expect(env?.auth?.accessToken).toBe('new-access-token');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('loadAuthConfig and getEnv fall back to legacy project config when global is empty', async () => {
  await withTempCliHome(async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    try {
      await mkdir(path.join(workspaceDir, '.nocobase'), { recursive: true });

      await saveAuthConfig(
        {
          currentEnv: 'legacy',
          envs: {
            legacy: {
              baseUrl: 'http://localhost:13000/api',
            },
          },
        },
        { scope: 'project' },
      );

      const config = await loadAuthConfig({ scope: 'global' });
      const currentEnv = await getCurrentEnvName({ scope: 'global' });
      const env = await getEnv(undefined, { scope: 'global' });

      expect(config.currentEnv).toBe('legacy');
      expect(config.envs.legacy?.apiBaseUrl).toBe('http://localhost:13000/api');
      expect(currentEnv).toBe('legacy');
      expect(env?.name).toBe('legacy');
      expect(env?.baseUrl).toBe('http://localhost:13000/api');
    } finally {
      cwdSpy.mockRestore();
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});

test('legacy baseUrl key is still readable but normalized to apiBaseUrl when loading config', async () => {
  await withTempCliHome(async () => {
    const configFile = path.join(resolveCliHomeDir('global'), 'config.json');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(configFile, JSON.stringify({
      currentEnv: 'legacy',
      envs: {
        legacy: {
          baseUrl: 'http://localhost:13000/api',
        },
      },
    }, null, 2));

    const config = await loadAuthConfig({ scope: 'global' });
    const env = await getEnv('legacy', { scope: 'global' });

    expect(config.envs.legacy?.apiBaseUrl).toBe('http://localhost:13000/api');
    expect(config.envs.legacy?.baseUrl).toBe(undefined);
    expect(env?.apiBaseUrl).toBe('http://localhost:13000/api');
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
  });
});

test('write operations keep using legacy project config when env only exists there', async () => {
  await withTempCliHome(async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-workspace-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    try {
      await mkdir(path.join(workspaceDir, '.nocobase'), { recursive: true });

      await saveAuthConfig(
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
        { scope: 'project' },
      );

      await updateEnvConnection('legacy', { accessToken: 'new-token' }, { scope: 'global' });
      await setCurrentEnv('legacy', { scope: 'global' });

      const projectConfig = await loadAuthConfig({ scope: 'project' });
      const globalConfigPath = path.join(process.env.NOCOBASE_CTL_HOME!, '.nocobase', 'config.json');

      expect(projectConfig.currentEnv).toBe('legacy');
      expect(projectConfig.envs.legacy?.auth).toEqual({
        type: 'token',
        accessToken: 'new-token',
      });
      await expect(readFile(globalConfigPath, 'utf8')).rejects.toThrow();

      const removal = await removeEnv('legacy', { scope: 'global' });
      const afterProjectConfig = await loadAuthConfig({ scope: 'project' });
      expect(removal.removed).toBe('legacy');
      expect(afterProjectConfig.envs.legacy).toBe(undefined);
    } finally {
      cwdSpy.mockRestore();
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});
