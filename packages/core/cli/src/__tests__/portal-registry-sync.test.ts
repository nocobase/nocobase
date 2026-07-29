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
import { normalizePortalRegistryItems, syncPortalRegistries } from '../lib/portal-registry-sync.js';
import type { PortalCreateEnvLike } from '../lib/portal-create.js';

const tempDirs: string[] = [];

async function createPortal() {
  const storagePath = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-registry-sync-'));
  tempDirs.push(storagePath);
  const portalDir = path.join(storagePath, 'portals', 'main', 'customer');
  await fsp.mkdir(path.join(portalDir, 'src', 'components', 'ui'), { recursive: true });
  await fsp.mkdir(path.join(portalDir, 'node_modules'), { recursive: true });
  await fsp.writeFile(path.join(portalDir, 'package.json'), '{"name":"portal"}\n');
  await fsp.writeFile(
    path.join(portalDir, 'components.json'),
    `${JSON.stringify({ style: 'base-nova', registries: { '@example': 'https://example.test/{name}' } }, null, 2)}\n`,
  );
  const env: PortalCreateEnvLike = {
    kind: 'local',
    apiBaseUrl: 'http://localhost:13000/api',
    storagePath,
    config: {
      apiBaseUrl: 'http://localhost:13000/api',
      storagePath,
      appPublicPath: '/',
    },
  };
  return { env, portalDir };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

test('normalizes specific items and defaults to the virtual all item', () => {
  expect(normalizePortalRegistryItems()).toEqual(['@nocobase/all']);
  expect(normalizePortalRegistryItems(['ai', '@nocobase/acl', 'ai'])).toEqual(['@nocobase/ai', '@nocobase/acl']);
  expect(() => normalizePortalRegistryItems(['@example/ai'])).toThrow(/Invalid Portal Registry item/);
});

test('configures the service Registry, installs selected items, and builds when requested', async () => {
  const { env, portalDir } = await createPortal();
  await fsp.rm(path.join(portalDir, 'node_modules'), { recursive: true, force: true });
  const runCommand = vi.fn(async () => undefined);

  const result = await syncPortalRegistries({
    portal: 'customer',
    env,
    items: ['ai', 'acl'],
    build: true,
    runCommand,
    probeRegistry: vi.fn(async () => ({ ok: true, status: 200 })),
  });

  expect(result).toMatchObject({ status: 'installed', items: ['@nocobase/ai', '@nocobase/acl'] });
  expect(runCommand).toHaveBeenNthCalledWith(
    2,
    'pnpm',
    ['exec', 'shadcn', 'add', '@nocobase/ai', '@nocobase/acl', '--yes', '--overwrite'],
    expect.objectContaining({ cwd: portalDir, envMode: 'replace', errorName: 'shadcn add' }),
  );
  expect(runCommand.mock.calls[1]?.[2]?.env).toMatchObject({
    NOCOBASE_API_URL: 'http://localhost:13000/api',
    NOCOBASE_PORTAL_BASE: '/x/customer/',
  });
  expect(runCommand.mock.calls.map(([name, args]) => [name, args])).toEqual([
    ['pnpm', ['install', '--frozen-lockfile']],
    ['pnpm', ['exec', 'shadcn', 'add', '@nocobase/ai', '@nocobase/acl', '--yes', '--overwrite']],
    ['pnpm', ['build']],
    ['pnpm', ['build:html']],
  ]);
  const components = JSON.parse(await fsp.readFile(path.join(portalDir, 'components.json'), 'utf8'));
  expect(components.registries).toEqual({
    '@example': 'https://example.test/{name}',
    '@nocobase': '${NOCOBASE_API_URL}/registry:get?name={name}',
  });
});

test('protects existing Registry and base UI files by default, including when installation fails', async () => {
  const { env, portalDir } = await createPortal();
  const uiDir = path.join(portalDir, 'src', 'components', 'ui');
  const extensionDir = path.join(portalDir, 'src', 'extensions', 'nocobase-ai');
  await fsp.mkdir(extensionDir, { recursive: true });
  await fsp.writeFile(path.join(uiDir, 'button.tsx'), 'user button\n');
  await fsp.writeFile(path.join(extensionDir, 'extension.tsx'), 'user extension\n');
  const runCommand = vi.fn(async (_name: string, args: string[]) => {
    if (args.includes('shadcn')) {
      await fsp.writeFile(path.join(uiDir, 'button.tsx'), 'registry button\n');
      await fsp.writeFile(path.join(uiDir, 'new-component.tsx'), 'new component\n');
      await fsp.writeFile(path.join(extensionDir, 'extension.tsx'), 'registry extension\n');
      await fsp.writeFile(path.join(extensionDir, 'new-file.ts'), 'new extension file\n');
      throw new Error('install failed');
    }
  });

  await expect(
    syncPortalRegistries({
      portal: 'customer',
      env,
      runCommand,
      probeRegistry: vi.fn(async () => ({ ok: true, status: 200 })),
    }),
  ).rejects.toThrow('install failed');

  expect(await fsp.readFile(path.join(uiDir, 'button.tsx'), 'utf8')).toBe('user button\n');
  expect(await fsp.readFile(path.join(uiDir, 'new-component.tsx'), 'utf8')).toBe('new component\n');
  expect(await fsp.readFile(path.join(extensionDir, 'extension.tsx'), 'utf8')).toBe('user extension\n');
  expect(await fsp.readFile(path.join(extensionDir, 'new-file.ts'), 'utf8')).toBe('new extension file\n');
  expect(runCommand.mock.calls[0]?.[1]).toEqual(['exec', 'shadcn', 'add', '@nocobase/all', '--yes', '--overwrite']);
});

test('skips installed Registry items by default and supports read-only diffs', async () => {
  const { env, portalDir } = await createPortal();
  const installedTarget = path.join(portalDir, 'src', 'extensions', 'nocobase-ai', 'extension.tsx');
  await fsp.mkdir(path.dirname(installedTarget), { recursive: true });
  await fsp.writeFile(installedTarget, 'installed\n');
  const registryItems = [
    { name: 'ai', targets: ['src/extensions/nocobase-ai/extension.tsx'] },
    { name: 'acl', targets: ['src/extensions/nocobase-acl/extension.tsx'] },
  ];
  const runCommand = vi.fn(async () => undefined);

  const result = await syncPortalRegistries({
    portal: 'customer',
    env,
    runCommand,
    probeRegistry: vi.fn(async () => ({ ok: true, status: 200, items: registryItems })),
  });

  expect(result).toMatchObject({
    items: ['@nocobase/acl'],
    skippedItems: ['@nocobase/ai'],
    status: 'installed',
  });
  expect(runCommand).toHaveBeenCalledWith(
    'pnpm',
    ['exec', 'shadcn', 'add', '@nocobase/acl', '--yes', '--overwrite'],
    expect.any(Object),
  );

  const diffCommand = vi.fn(async () => undefined);
  const diffResult = await syncPortalRegistries({
    portal: 'customer',
    env,
    items: ['ai'],
    diff: true,
    runCommand: diffCommand,
    probeRegistry: vi.fn(async () => ({ ok: true, status: 200, items: registryItems })),
  });

  expect(diffResult).toMatchObject({ items: ['@nocobase/ai'], skippedItems: [], status: 'diffed' });
  expect(diffCommand).toHaveBeenCalledWith(
    'pnpm',
    ['exec', 'shadcn', 'add', '@nocobase/ai', '--yes', '--diff'],
    expect.any(Object),
  );
});

test('overwrite replaces Registry files but protects base UI unless overwrite UI is enabled', async () => {
  const { env, portalDir } = await createPortal();
  const uiDir = path.join(portalDir, 'src', 'components', 'ui');
  const extensionDir = path.join(portalDir, 'src', 'extensions', 'nocobase-ai');
  await fsp.mkdir(extensionDir, { recursive: true });
  await fsp.writeFile(path.join(uiDir, 'button.tsx'), 'user button\n');
  await fsp.writeFile(path.join(extensionDir, 'extension.tsx'), 'user extension\n');
  const runCommand = vi.fn(async (_name: string, args: string[]) => {
    if (args.includes('shadcn')) {
      await fsp.writeFile(path.join(uiDir, 'button.tsx'), 'registry button\n');
      await fsp.writeFile(path.join(extensionDir, 'extension.tsx'), 'registry extension\n');
    }
  });

  await syncPortalRegistries({
    portal: 'customer',
    env,
    overwrite: true,
    runCommand,
    probeRegistry: vi.fn(async () => ({ ok: true, status: 200 })),
  });

  expect(await fsp.readFile(path.join(uiDir, 'button.tsx'), 'utf8')).toBe('user button\n');
  expect(await fsp.readFile(path.join(extensionDir, 'extension.tsx'), 'utf8')).toBe('registry extension\n');

  const second = await createPortal();
  const secondUiDir = path.join(second.portalDir, 'src', 'components', 'ui');
  await fsp.writeFile(path.join(secondUiDir, 'button.tsx'), 'user button\n');
  const overwriteUiCommand = vi.fn(async (_name: string, args: string[]) => {
    if (args.includes('shadcn')) {
      await fsp.writeFile(path.join(secondUiDir, 'button.tsx'), 'registry button\n');
    }
  });

  await syncPortalRegistries({
    portal: 'customer',
    env: second.env,
    overwrite: true,
    overwriteUi: true,
    runCommand: overwriteUiCommand,
    probeRegistry: vi.fn(async () => ({ ok: true, status: 200 })),
  });

  expect(await fsp.readFile(path.join(secondUiDir, 'button.tsx'), 'utf8')).toBe('registry button\n');

  await expect(
    syncPortalRegistries({
      portal: 'customer',
      env: second.env,
      overwriteUi: true,
    }),
  ).rejects.toThrow('--overwrite-ui requires --overwrite');
});

test('automatic sync skips an unsupported service but reports connection failures', async () => {
  const { env, portalDir } = await createPortal();
  const runCommand = vi.fn(async () => undefined);
  const onWarning = vi.fn();

  const result = await syncPortalRegistries({
    portal: 'customer',
    env,
    skipIfUnsupported: true,
    runCommand,
    onWarning,
    probeRegistry: vi.fn(async () => ({ ok: false, status: 404 })),
  });

  expect(result).toMatchObject({ status: 'unsupported' });
  expect(runCommand).not.toHaveBeenCalled();
  expect(onWarning).toHaveBeenCalledOnce();
  const components = JSON.parse(await fsp.readFile(path.join(portalDir, 'components.json'), 'utf8'));
  expect(components.registries).not.toHaveProperty('@nocobase');
  await expect(
    syncPortalRegistries({
      portal: 'customer',
      env,
      skipIfUnsupported: true,
      probeRegistry: vi.fn(async () => {
        throw new Error('connection refused');
      }),
    }),
  ).rejects.toThrow(/connection refused/);
});
