/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GridRows, LegacyGridRows, normalizeGridRows } from './gridDragPlanner';

export const findModelUidPosition = (uid: string, rows: GridRows | LegacyGridRows) => {
  const normalizedRows = normalizeGridRows(rows);

  for (let rowIndex = 0; rowIndex < normalizedRows.length; rowIndex += 1) {
    const columns = normalizedRows[rowIndex] || [];
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      for (let itemIndex = 0; itemIndex < column.length; itemIndex += 1) {
        if (column[itemIndex] === uid) {
          return { rowIndex, columnIndex, itemIndex } as const;
        }
      }
    }
  }

  return null;
};
