/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function resolveExistingPath(target: string): Promise<string> {
  const resolved = path.resolve(target);
  try {
    return await realpath(resolved);
  } catch {
    return resolved;
  }
}

function isSameOrAncestor(candidate: string, child: string): boolean {
  const relative = path.relative(candidate, child);
  return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function isUnsafePortalDeletePath(target: string): Promise<boolean> {
  const resolvedTarget = await resolveExistingPath(target);
  const root = path.parse(resolvedTarget).root;
  if (resolvedTarget === root) {
    return true;
  }

  const homeDir = await resolveExistingPath(os.homedir());
  if (resolvedTarget === homeDir) {
    return true;
  }

  const cwd = await resolveExistingPath(process.cwd());
  return isSameOrAncestor(resolvedTarget, cwd);
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

async function isEmptyDirectory(target: string): Promise<boolean> {
  try {
    return (await readdir(target)).length === 0;
  } catch {
    return false;
  }
}

async function hasNocoBasePackageField(target: string): Promise<boolean> {
  try {
    const data = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf-8')) as unknown;
    return (
      !!data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      Object.prototype.hasOwnProperty.call(data, 'nocobase')
    );
  } catch {
    return false;
  }
}

export async function canReplacePortalDirectory(target: string): Promise<boolean> {
  const resolvedTarget = await resolveExistingPath(target);
  const root = path.parse(resolvedTarget).root;
  if (resolvedTarget === root || resolvedTarget === (await resolveExistingPath(os.homedir()))) {
    return false;
  }
  if (!(await isDirectory(resolvedTarget))) {
    return false;
  }
  return (await isEmptyDirectory(resolvedTarget)) || (await hasNocoBasePackageField(resolvedTarget));
}
