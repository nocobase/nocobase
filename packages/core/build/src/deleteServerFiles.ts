/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import type { PkgLog } from './utils';

const targetDir = 'dist';
const preservedDistEntries = new Set(['client', 'client-v2']);

export function shouldPreserveDistEntry(item: string) {
  // fast-glob may return POSIX-style absolute paths on Windows, so use the
  // win32 parser here to recognize both `\` and `/` as path separators.
  return preservedDistEntries.has(path.win32.basename(item));
}

export function deleteServerFiles(cwd: string, log: PkgLog) {
  log('delete server files');
  const distDir = path.join(cwd, targetDir);
  const files = fg.globSync(['*'], {
    cwd: distDir,
    absolute: true,
    deep: 1,
    onlyFiles: true,
  });
  const dirs = fg.globSync(['*', '!node_modules'], {
    cwd: distDir,
    absolute: true,
    deep: 1,
    onlyDirectories: true,
  });

  [...files, ...dirs].forEach((item) => {
    if (shouldPreserveDistEntry(item)) {
      return;
    }

    fs.removeSync(item);
  });
}
