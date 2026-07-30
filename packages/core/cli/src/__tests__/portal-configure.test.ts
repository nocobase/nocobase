/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import type { RequestOptions } from '../lib/api-client.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';
import { configurePortalWorkspace } from '../lib/portal-configure.js';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createEnv(params: { storagePath: string; kind?: PortalCreateEnvLike['kind'] }): PortalCreateEnvLike {
  return {
    kind: params.kind ?? 'http',
    apiBaseUrl: 'https://example.com/api',
    storagePath: params.storagePath,
    config: {
      apiBaseUrl: 'https://example.com/api',
      storagePath: params.storagePath,
    },
  };
}

async function preparePortalWorkspace(storagePath: string): Promise<string> {
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(portalDir, { recursive: true });
  await fsp.writeFile(
    path.join(portalDir, 'portal.config.json'),
    '{\n  "portal": "customer",\n  "sourceStorage": "nocobase"\n}\n',
  );
  return portalDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('updates local Portal config and syncs remote options when the remote record exists', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-config-storage-');
  const portalDir = await preparePortalWorkspace(storagePath);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:list') {
      return {
        ok: true,
        status: 200,
        data: {
          data: [
            {
              uid: 'customer',
              portalName: 'customer',
              routePath: '/customer',
              portalType: 'ai',
              enabled: true,
              options: {
                sourceRevision: 'rev0',
              },
            },
          ],
        },
      };
    }

    expect(options.operation.pathTemplate).toBe('/multiPortals:update');
    expect(options.flags.filterByTk).toBe('customer');
    expect(JSON.parse(String(options.flags.body))).toEqual({
      options: {
        sourceRevision: 'rev0',
        sourceStorage: 'git',
        git: {
          repo: 'git@github.com:nocobase/customer-portal.git',
          branch: 'main',
          path: 'portals/customer',
        },
      },
    });
    return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
  });

  await expect(
    configurePortalWorkspace({
      portal: 'customer',
      directory: portalDir,
      envName: 'prod',
      cliVersion: '1.2.3',
      env: createEnv({ storagePath }),
      sourceStorage: 'git',
      gitRepo: 'git@github.com:nocobase/customer-portal.git',
      gitPath: 'portals/customer',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    portal: 'customer',
    portalDir,
    remoteSynced: true,
    config: {
      portal: 'customer',
      sourceStorage: 'git',
      git: {
        repo: 'git@github.com:nocobase/customer-portal.git',
        branch: 'main',
        path: 'portals/customer',
      },
    },
  });
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    '{\n  "portal": "customer",\n  "sourceStorage": "git",\n  "git": {\n    "repo": "git@github.com:nocobase/customer-portal.git",\n    "branch": "main",\n    "path": "portals/customer"\n  }\n}\n',
  );
  expect(apiRequest.mock.calls.map((call) => call[0].operation.pathTemplate)).toEqual([
    '/multiPortals:list',
    '/multiPortals:update',
  ]);
});

test('writes local Portal config without remote sync when the remote record is missing', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-config-storage-');
  const portalDir = await preparePortalWorkspace(storagePath);
  const apiRequest = vi.fn(async () => ({ ok: true, status: 200, data: { data: [] } }));

  await expect(
    configurePortalWorkspace({
      portal: 'customer',
      directory: portalDir,
      env: createEnv({ storagePath }),
      sourceStorage: 'nocobase',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    remoteSynced: false,
  });
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    '{\n  "portal": "customer",\n  "sourceStorage": "nocobase"\n}\n',
  );
  expect(apiRequest).toHaveBeenCalledTimes(1);
});

test('defaults Git path to the repository root', async () => {
  const storagePath = await makeTempDir('nocobase-cli-portal-config-storage-');
  const portalDir = await preparePortalWorkspace(storagePath);
  const apiRequest = vi.fn(async (options: RequestOptions) => {
    if (options.operation.pathTemplate === '/multiPortals:update') {
      expect(JSON.parse(String(options.flags.body))).toEqual({
        options: {
          sourceStorage: 'git',
          git: {
            repo: 'git@github.com:nocobase/customer-portal.git',
            branch: 'main',
            path: '.',
          },
        },
      });
      return { ok: true, status: 200, data: { data: { uid: 'customer' } } };
    }
    return {
      ok: true,
      status: 200,
      data: {
        data: [
          {
            uid: 'customer',
            portalName: 'customer',
            routePath: '/customer',
            portalType: 'ai',
            enabled: true,
          },
        ],
      },
    };
  });

  await expect(
    configurePortalWorkspace({
      portal: 'customer',
      directory: portalDir,
      env: createEnv({ storagePath }),
      sourceStorage: 'git',
      gitRepo: 'git@github.com:nocobase/customer-portal.git',
      apiRequest,
    }),
  ).resolves.toMatchObject({
    config: {
      portal: 'customer',
      sourceStorage: 'git',
      git: {
        repo: 'git@github.com:nocobase/customer-portal.git',
        branch: 'main',
        path: '.',
      },
    },
  });
  await expect(fsp.readFile(path.join(portalDir, 'portal.config.json'), 'utf-8')).resolves.toBe(
    '{\n  "portal": "customer",\n  "sourceStorage": "git",\n  "git": {\n    "repo": "git@github.com:nocobase/customer-portal.git",\n    "branch": "main",\n    "path": "."\n  }\n}\n',
  );
});
