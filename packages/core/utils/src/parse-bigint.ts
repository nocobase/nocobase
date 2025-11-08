/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const parseBigIntValue = (val: string | number) => {
  if (val === null || val === undefined) {
    return val;
  }
  try {
    const big = BigInt(val);
    return big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : val;
  } catch {
    return val;
  }
};
