/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const findModelUidPosition = (uid: string, rows: Record<string, string[][]>) => {
  // 找到 sourceUid 和 targetUid 的位置
  let result: { rowId: string; columnIndex: number; itemIndex: number } | null = null;

  for (const [rowId, columns] of Object.entries(rows)) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      for (let itemIndex = 0; itemIndex < column.length; itemIndex++) {
        if (column[itemIndex] === uid) {
          result = { rowId, columnIndex, itemIndex };
        }
      }
    }
  }

  return result;
};
