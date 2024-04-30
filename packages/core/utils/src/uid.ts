/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

let IDX = 36,
  HEX = '';
while (IDX--) HEX += IDX.toString(36);

export function uid(len?: number) {
  let str = '',
    num = len || 11;
  while (num--) str += HEX[(Math.random() * 36) | 0];
  return str;
}
