/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { access, lstat, readlink, realpath, rm } from 'node:fs/promises';

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function resolvePluginStoragePath(storagePath?: string): string {
  const root = String(storagePath ?? process.env.STORAGE_PATH ?? '').trim();
  if (root) {
    return path.join(path.isAbsolute(root) ? root : path.resolve(process.cwd(), root), 'plugins');
  }

  const configured = String(process.env.PLUGIN_STORAGE_PATH ?? '').trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }

  return path.resolve(process.cwd(), 'storage', 'plugins');
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
