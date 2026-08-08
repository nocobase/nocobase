/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from './hash';
import { normalizePath } from './path-normalize';

export { normalizePath };

export function pathHash(path: string): string {
  return sha256Hex(normalizePath(path));
}

export function pathLowerHash(path: string): string {
  return sha256Hex(normalizePath(path).toLowerCase());
}
