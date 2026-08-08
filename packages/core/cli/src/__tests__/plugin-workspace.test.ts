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
import {
  resolveLocalPluginWorkspace,
  syncPluginWorkspace,
} from '../lib/plugin-workspace.js';

async function writeFile(filePath: string, content: string) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content, 'utf8');
}

async function writePlugin(root: string, packageName: string): Promise<string> {
  const pluginPath = path.join(root, 'plugins', ...packageName.split('/'));
  await fsp.mkdir(pluginPath, { recursive: true });
  await fsp.writeFile(
    path.join(pluginPath, 'package.json'),
    `${JSON.stringify({ name: packageName, version: '1.0.0' }, null, 2)}\n`,
    'utf8',
  );
  return pluginPath;
}

async function createCliManagedAppRoot(): Promise<{ root: string; sourcePath: string }> {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'nb-plugin-workspace-'));
  const sourcePath = path.join(root, 'source');
  const binName = process.platform === 'win32' ? 'nocobase-v1.cmd' : 'nocobase-v1';
  await writeFile(path.join(sourcePath, 'node_modules', '.bin', binName), '');
  await fsp.mkdir(path.join(root, 'storage'), { recursive: true });
  return { root, sourcePath };
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('syncPluginWorkspace creates source links for top-level plugins', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();
  const pluginPath = await writePlugin(root, '@scope/plugin-hello');

  try {
    const result = await syncPluginWorkspace({
      appPath: root,
      sourcePath,
      mode: 'all',
    });

    const linkPath = path.join(sourcePath, 'packages', 'plugins', '@scope', 'plugin-hello');
    expect(result.createdPluginWorkspace).toBe(false);
    expect(result.createdSourcePluginRoot).toBe(true);
    expect(result.linked).toEqual(['@scope/plugin-hello']);
    expect(await fsp.realpath(linkPath)).toBe(await fsp.realpath(pluginPath));
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('syncPluginWorkspace removes dangling source links when top-level plugin is missing', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();

  try {
    const danglingTarget = path.join(root, 'plugins', '@scope', 'plugin-missing');
    const danglingLink = path.join(sourcePath, 'packages', 'plugins', '@scope', 'plugin-missing');
    await fsp.mkdir(path.dirname(danglingLink), { recursive: true });
    await fsp.symlink(danglingTarget, danglingLink, process.platform === 'win32' ? 'junction' : 'dir');

    const result = await syncPluginWorkspace({
      appPath: root,
      sourcePath,
      mode: 'targeted',
      targetPackageNames: ['@scope/plugin-missing'],
    });

    expect(result.removedDangling).toEqual(['@scope/plugin-missing']);
    await expect(fsp.lstat(danglingLink)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('syncPluginWorkspace errors on conflicting real source directories by default', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();
  await writePlugin(root, '@scope/plugin-hello');

  try {
    const sourceDir = path.join(sourcePath, 'packages', 'plugins', '@scope', 'plugin-hello');
    await fsp.mkdir(sourceDir, { recursive: true });

    await expect(
      syncPluginWorkspace({
        appPath: root,
        sourcePath,
        mode: 'targeted',
        targetPackageNames: ['@scope/plugin-hello'],
      }),
    ).rejects.toThrow('Plugin workspace conflict detected for "@scope/plugin-hello".');
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('syncPluginWorkspace force recreates conflicting source entries', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();
  const pluginPath = await writePlugin(root, '@scope/plugin-hello');

  try {
    const sourceDir = path.join(sourcePath, 'packages', 'plugins', '@scope', 'plugin-hello');
    await fsp.mkdir(sourceDir, { recursive: true });
    await fsp.writeFile(path.join(sourceDir, 'package.json'), '{}', 'utf8');

    const result = await syncPluginWorkspace({
      appPath: root,
      sourcePath,
      mode: 'targeted',
      targetPackageNames: ['@scope/plugin-hello'],
      forceRecreate: true,
    });

    expect(result.relinked).toEqual(['@scope/plugin-hello']);
    expect(result.warnings).toHaveLength(1);
    expect(await fsp.realpath(sourceDir)).toBe(await fsp.realpath(pluginPath));
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('resolveLocalPluginWorkspace supports app path as a special cwd input', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();

  try {
    await expect(resolveLocalPluginWorkspace({ cwd: root, supportAppPath: true })).resolves.toEqual({
      appPath: root,
      sourcePath,
    });
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('resolveLocalPluginWorkspace errors when app path has no source directory', async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'nb-plugin-workspace-app-'));

  try {
    await expect(resolveLocalPluginWorkspace({ cwd: root, supportAppPath: true })).rejects.toThrow(
      `Couldn't find a NocoBase source project from --cwd: ${root}`,
    );
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('syncPluginWorkspace uses junction links on Windows', async () => {
  const { root, sourcePath } = await createCliManagedAppRoot();
  await writePlugin(root, '@scope/plugin-hello');
  const symlinkSpy = vi.spyOn(fsp, 'symlink').mockResolvedValue(undefined as never);
  const platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');

  try {
    await syncPluginWorkspace({
      appPath: root,
      sourcePath,
      mode: 'all',
    });

    expect(symlinkSpy).toHaveBeenCalledWith(
      path.join(root, 'plugins', '@scope', 'plugin-hello'),
      path.join(sourcePath, 'packages', 'plugins', '@scope', 'plugin-hello'),
      'junction',
    );
  } finally {
    platformSpy.mockRestore();
    symlinkSpy.mockRestore();
    await fsp.rm(root, { recursive: true, force: true });
  }
});
