/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import fs from 'fs-extra';

export function resolvePluginStoragePath(storagePath?: string): string {
  const configured = String(process.env.PLUGIN_STORAGE_PATH ?? '').trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }

  const root = String(storagePath ?? process.env.STORAGE_PATH ?? '').trim();
  if (root) {
    return path.join(path.isAbsolute(root) ? root : path.resolve(process.cwd(), root), 'plugins');
  }

  return path.resolve(process.cwd(), 'storage', 'plugins');
}

async function getStoragePluginNames(target: string): Promise<string[]> {
  const plugins: string[] = [];
  const items = await fs.readdir(target);

  for (const item of items) {
    const itemPath = path.resolve(target, item);

    if (item.startsWith('@')) {
      const statResult = await fs.stat(itemPath);
      if (!statResult.isDirectory()) {
        continue;
      }
      const children = await getStoragePluginNames(itemPath);
      plugins.push(...children.map((child) => `${item}/${child}`));
      continue;
    }

    if (await fs.pathExists(path.resolve(itemPath, 'package.json'))) {
      plugins.push(item);
    }
  }

  return plugins;
}

async function ensureOrgDirectory(nodeModulesPath: string, pluginName: string): Promise<void> {
  if (!pluginName.startsWith('@')) {
    return;
  }
  const [orgName] = pluginName.split('/');
  await fs.ensureDir(path.resolve(nodeModulesPath, orgName));
}

async function isSymlinkValid(linkPath: string, targetPath: string): Promise<boolean> {
  try {
    if (await fs.pathExists(linkPath)) {
      const realPath = await fs.realpath(linkPath);
      return realPath === targetPath;
    }
  } catch {
    return false;
  }
  return false;
}

async function createStoragePluginSymlink(
  storagePluginsPath: string,
  nodeModulesPath: string,
  pluginName: string,
): Promise<void> {
  const targetPath = path.resolve(storagePluginsPath, pluginName);
  if (!(await fs.pathExists(targetPath))) {
    return;
  }

  await ensureOrgDirectory(nodeModulesPath, pluginName);
  const linkPath = path.resolve(nodeModulesPath, pluginName);
  if (await isSymlinkValid(linkPath, targetPath)) {
    return;
  }

  await fs.remove(linkPath);
  await fs.symlink(targetPath, linkPath, 'dir');
}

export async function createStoragePluginsSymlink(
  storagePath?: string,
  nodeModulesPath = String(process.env.NODE_MODULES_PATH ?? '').trim(),
): Promise<void> {
  if (!nodeModulesPath) {
    return;
  }

  const storagePluginsPath = resolvePluginStoragePath(storagePath);
  if (!(await fs.pathExists(storagePluginsPath))) {
    return;
  }

  const pluginNames = await getStoragePluginNames(storagePluginsPath);
  await Promise.all(
    pluginNames.map(async (pluginName) =>
      await createStoragePluginSymlink(storagePluginsPath, nodeModulesPath, pluginName)),
  );
}

export async function removeStoragePluginSymlink(
  pluginName: string,
  storagePath?: string,
  nodeModulesPath = String(process.env.NODE_MODULES_PATH ?? '').trim(),
): Promise<boolean> {
  if (!nodeModulesPath) {
    return false;
  }

  const storagePluginsPath = resolvePluginStoragePath(storagePath);
  const targetPath = path.resolve(storagePluginsPath, pluginName);
  const linkPath = path.resolve(nodeModulesPath, pluginName);
  if (!(await fs.pathExists(linkPath))) {
    return false;
  }

  let statResult;
  try {
    statResult = await fs.lstat(linkPath);
  } catch {
    return false;
  }

  if (!statResult.isSymbolicLink()) {
    return false;
  }

  let resolvedLinkTarget = '';
  try {
    const linkTarget = await fs.readlink(linkPath);
    resolvedLinkTarget = path.resolve(path.dirname(linkPath), linkTarget);
  } catch {
    return false;
  }

  if (resolvedLinkTarget !== targetPath) {
    return false;
  }

  await fs.remove(linkPath);
  return true;
}
