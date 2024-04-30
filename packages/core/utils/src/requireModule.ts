/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { pathToFileURL } from 'url';

export function requireModule(m: any) {
  if (typeof m === 'string') {
    m = require(m);
  }

  if (typeof m !== 'object') {
    return m;
  }

  return m.__esModule ? m.default : m;
}

export default requireModule;

export async function importModule(m: string) {
  if (!process.env.VITEST) {
    return requireModule(m);
  }

  if (path.isAbsolute(m)) {
    m = pathToFileURL(m).href;
  }

  const r = (await import(m)).default;
  return r.__esModule ? r.default : r;
}
