/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

/**
 * Absolute path to the application storage root (same rules as CLI `resolveStorageRoot` in `cli-v1/src/util.js`).
 */
export function resolveStorageRoot(): string {
  const raw = process.env.STORAGE_PATH;
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.resolve(process.cwd(), 'storage');
}

/**
 * Join path segments under the application storage root.
 * Resolution matches CLI `resolveStorageRoot()` / `initEnv`: use `STORAGE_PATH` when set
 * (absolute or relative to cwd), otherwise `<cwd>/storage`.
 *
 * @example storagePathJoin('tmp')
 * @example storagePathJoin('cache', 'apps', appName)
 */
export function storagePathJoin(...segments: string[]): string {
  return path.join(resolveStorageRoot(), ...segments);
}
