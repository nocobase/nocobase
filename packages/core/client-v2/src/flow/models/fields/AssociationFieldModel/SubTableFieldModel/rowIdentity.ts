/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';

type FilterTargetKey = string | string[] | null | undefined;
type SubTableRow = {
  __is_new__?: boolean;
  id?: any;
  [key: string]: any;
};

export const SUB_TABLE_TEMP_ROW_KEY = '__index__';

function getPersistedRowKey(record: SubTableRow, filterTargetKey: FilterTargetKey) {
  if (!filterTargetKey) return null;

  if (Array.isArray(filterTargetKey)) {
    const values = filterTargetKey.map((k) => record?.[k]);
    if (values.some((v) => v == null)) return null;
    return values.map((v) => String(v)).join('__');
  }

  const value = record?.[filterTargetKey];
  return value == null ? null : String(value);
}

export function getSubTableRowIdentity(record: SubTableRow, filterTargetKey: FilterTargetKey) {
  const tempKey = record?.[SUB_TABLE_TEMP_ROW_KEY];
  if (record?.__is_new__ && tempKey != null && tempKey !== '') {
    return `tmp:${String(tempKey)}`;
  }

  const persistedKey = getPersistedRowKey(record, filterTargetKey);
  if (persistedKey != null) {
    return `pk:${persistedKey}`;
  }

  if (tempKey != null && tempKey !== '') {
    return `tmp:${String(tempKey)}`;
  }

  return null;
}

export function normalizeSubTableRows(rows: SubTableRow[]) {
  if (!rows.length) return rows;

  let changed = false;
  const normalized = rows.map((row) => {
    const tempKey = row?.[SUB_TABLE_TEMP_ROW_KEY];
    if (!row.__is_new__ || (tempKey != null && tempKey !== '')) {
      return row;
    }

    changed = true;
    return {
      ...row,
      [SUB_TABLE_TEMP_ROW_KEY]: uid(),
    };
  });

  return changed ? normalized : rows;
}
