/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SubTableRowPendingValues = Record<string, any>;

type SubTableLatestValue =
  | {
      ok: true;
      value: any;
    }
  | {
      ok: false;
    };

const subTablePendingRowValues = new WeakMap<object, Map<string, SubTableRowPendingValues>>();

function isSubTableEventLikeValue(value: any) {
  return (
    value &&
    typeof value === 'object' &&
    (typeof value.preventDefault === 'function' ||
      typeof value.stopPropagation === 'function' ||
      value.nativeEvent ||
      value.currentTarget)
  );
}

export function normalizeSubTableLatestValue(value: any): SubTableLatestValue {
  if (isSubTableEventLikeValue(value)) {
    if (typeof value.target?.value !== 'undefined') {
      return { ok: true, value: value.target.value };
    }
    return { ok: false };
  }

  return { ok: true, value };
}

function getSubTablePendingValueHost(host: object | null | undefined) {
  if (!host || typeof host !== 'object') return null;
  let rows = subTablePendingRowValues.get(host);
  if (!rows) {
    rows = new Map();
    subTablePendingRowValues.set(host, rows);
  }
  return rows;
}

export function setSubTablePendingRowFieldValue(
  host: object | null | undefined,
  rowKey: string | null | undefined,
  fieldName: string | null | undefined,
  inputValue: any,
) {
  const latest = normalizeSubTableLatestValue(inputValue);
  if (!latest.ok || !rowKey || !fieldName) return;

  const rows = getSubTablePendingValueHost(host);
  if (!rows) return;

  rows.set(rowKey, {
    ...(rows.get(rowKey) || {}),
    [fieldName]: latest.value,
  });
}

export function getSubTablePendingRowValues(host: object | null | undefined, rowKey: string | null | undefined) {
  if (!host || typeof host !== 'object' || !rowKey) return undefined;
  return subTablePendingRowValues.get(host)?.get(rowKey);
}

export function clearSubTablePendingRowFieldValue(
  host: object | null | undefined,
  rowKey: string | null | undefined,
  fieldName: string | null | undefined,
) {
  if (!host || typeof host !== 'object' || !rowKey || !fieldName) return;

  const rows = subTablePendingRowValues.get(host);
  const pendingValues = rows?.get(rowKey);
  if (!pendingValues || !Object.prototype.hasOwnProperty.call(pendingValues, fieldName)) return;

  const nextValues = { ...pendingValues };
  delete nextValues[fieldName];
  if (Object.keys(nextValues).length) {
    rows.set(rowKey, nextValues);
  } else {
    rows.delete(rowKey);
  }
}

export function clearSubTablePendingRowValues(host: object | null | undefined, rowKey?: string | null | undefined) {
  if (!host || typeof host !== 'object') return;

  if (!rowKey) {
    subTablePendingRowValues.delete(host);
    return;
  }

  subTablePendingRowValues.get(host)?.delete(rowKey);
}

export function mergeSubTableRowPendingValues(record: any, pendingValues?: SubTableRowPendingValues) {
  if (!pendingValues || !Object.keys(pendingValues).length) return record;
  const baseRecord = record && typeof record === 'object' ? record : {};
  return {
    ...baseRecord,
    ...pendingValues,
  };
}
