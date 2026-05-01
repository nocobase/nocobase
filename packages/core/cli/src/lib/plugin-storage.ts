/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { access, lstat, mkdir, readdir, readlink, realpath, rm, stat, symlink } from 'node:fs/promises';

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

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
  const items = await readdir(target);

  for (const item of items) {
    const itemPath = path.resolve(target, item);

    if (item.startsWith('@')) {
      const statResult = await stat(itemPath);
      if (!statResult.isDirectory()) {
        continue;
      }
      const children = await getStoragePluginNames(itemPath);
      plugins.push(...children.map((child) => `${item}/${child}`));
      continue;
    }

    if (await pathExists(path.resolve(itemPath, 'package.json'))) {
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
  await mkdir(path.resolve(nodeModulesPath, orgName), { recursive: true });
}

async function isSymlinkValid(linkPath: string, targetPath: string): Promise<boolean> {
  try {
    if (await pathExists(linkPath)) {
      const realPath = await realpath(linkPath);
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
  if (!(await pathExists(targetPath))) {
    return;
  }

  await ensureOrgDirectory(nodeModulesPath, pluginName);
  const linkPath = path.resolve(nodeModulesPath, pluginName);
  if (await isSymlinkValid(linkPath, targetPath)) {
    return;
  }

  await rm(linkPath, { recursive: true, force: true });
  await symlink(targetPath, linkPath, 'dir');
}

export async function createStoragePluginsSymlink(
  storagePath?: string,
  nodeModulesPath = String(process.env.NODE_MODULES_PATH ?? '').trim(),
): Promise<void> {
  if (!nodeModulesPath) {
    return;
  }

  const storagePluginsPath = resolvePluginStoragePath(storagePath);
  if (!(await pathExists(storagePluginsPath))) {
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
  if (!(await pathExists(linkPath))) {
    return false;
  }

  let statResult;
  try {
    statResult = await lstat(linkPath);
  } catch {
    return false;
  }

  if (!statResult.isSymbolicLink()) {
    return false;
  }

  let resolvedLinkTarget = '';
  try {
    const linkTarget = await readlink(linkPath);
    resolvedLinkTarget = path.resolve(path.dirname(linkPath), linkTarget);
  } catch {
    return false;
  }

  if (resolvedLinkTarget !== targetPath) {
    return false;
  }

  await rm(linkPath, { recursive: true, force: true });
  return true;
}
