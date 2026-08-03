/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { realpath } from 'node:fs/promises';
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
