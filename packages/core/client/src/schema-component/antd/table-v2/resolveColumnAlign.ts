/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Field interfaces whose columns are right-aligned by default in tables.
// Right-alignment makes decimal-aligned values comparable at a glance, which
// matches accounting/spreadsheet convention. Users can override per column
// via x-component-props.align.
export const NUMERIC_COLUMN_INTERFACES = new Set(['number', 'integer', 'percent']);

export type ColumnAlign = 'left' | 'center' | 'right';

export function resolveColumnAlign(
  explicitAlign: ColumnAlign | undefined,
  fieldInterface: string | undefined,
): ColumnAlign | undefined {
  if (explicitAlign != null) return explicitAlign;
  return NUMERIC_COLUMN_INTERFACES.has(fieldInterface) ? 'right' : undefined;
}
