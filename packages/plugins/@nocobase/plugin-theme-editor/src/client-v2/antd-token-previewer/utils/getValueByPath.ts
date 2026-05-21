/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default function getValueByPath(obj: any, path: string[]): any {
  if (!obj) {
    return undefined;
  }
  return path.reduce((prev, key) => {
    if (prev) {
      return prev[key];
    }
    return undefined;
  }, obj);
}
