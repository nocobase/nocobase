/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const columnCountMarks = [1, 2, 3, 4, 6, 8, 12, 24].reduce((obj, cur) => {
  obj[cur] = cur;
  return obj;
}, {});
