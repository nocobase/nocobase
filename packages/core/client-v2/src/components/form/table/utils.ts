/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type React from 'react';

/**
 * Same shape as antd Table's `rowKey` prop — either a record key name or a
 * function. Hoisted here so utilities and `Table.tsx` agree on the contract.
 */
export type RowKey<RecordType extends object> =
  | (keyof RecordType & (string | number))
  | ((record: RecordType, index?: number) => React.Key);

/**
 * Read a stable row id off a record. Mirrors antd Table's rowKey resolution
 * but normalises non-primitive ids to strings so `data-row-key` attributes
 * and `useSortable({ id })` agree on equality.
 */
export function readRowKey<RecordType extends object>(
  record: RecordType,
  rowKey: RowKey<RecordType>,
  index?: number,
): React.Key | undefined {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  const value = record[rowKey] as unknown;
  if (value == null) return undefined;
  return typeof value === 'string' || typeof value === 'number' ? value : String(value);
}

/**
 * Pixel-perfect snapshot of a rendered `<tr>` for the drag overlay clone.
 * Contains everything needed to rebuild a visually identical floating row
 * without re-running antd's column layout pass.
 */
export type RowSnapshot = {
  /** outerHTML of the source `<tr>`, captured at drag start. */
  html: string;
  /** Per-cell pixel widths (in DOM order) so the clone can fix them via `<col>`. */
  cellWidths: number[];
  /** Total row width — used as the wrapper width so the clone matches source horizontally. */
  totalWidth: number;
  /** Total row height — applied to the clone so cell padding matches the source row exactly. */
  totalHeight: number;
};

/**
 * Snapshot the source `<tr>` so the drag overlay can render a pixel-accurate
 * floating clone. We can't reliably recompute the layout from `columns` alone
 * — antd auto-sizes columns at runtime based on content + the surrounding
 * container — so we read the rendered widths off the DOM at drag start. The
 * row height is captured too because antd's cell padding rules are scoped to
 * a selector chain we strip in the clone.
 */
export function snapshotSourceRow(rowKey: string): RowSnapshot | null {
  if (typeof document === 'undefined') return null;
  // `CSS.escape` is in lib.dom and shipped in every browser we target; the
  // guard is purely a belt-and-suspenders against exotic test environments
  // where `window.CSS` may be absent.
  const cssGlobal: { escape?: (value: string) => string } | undefined =
    typeof window !== 'undefined' ? window.CSS : undefined;
  const escaped = cssGlobal?.escape ? cssGlobal.escape(rowKey) : rowKey;
  const sourceRow = document.querySelector(`tr[data-row-key="${escaped}"]`) as HTMLTableRowElement | null;
  if (!sourceRow) return null;
  const cellWidths = Array.from(sourceRow.cells).map((cell) => cell.getBoundingClientRect().width);
  const rect = sourceRow.getBoundingClientRect();
  return { html: sourceRow.outerHTML, cellWidths, totalWidth: rect.width, totalHeight: rect.height };
}
