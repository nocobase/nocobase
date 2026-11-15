/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type RecordData = Record<string, unknown>;
type TargetValue = string | number;

// hasMany destroy identifies rows by the association target key, not the collection filterTargetKey.
export function getHasManyDeleteFilterByTk(
  targetKey: unknown,
  records: RecordData | RecordData[],
): TargetValue | TargetValue[] | undefined {
  if (typeof targetKey !== 'string' || !targetKey) {
    return undefined;
  }
  const rows = Array.isArray(records) ? records : [records];
  const values: TargetValue[] = [];
  for (const row of rows) {
    const value = row?.[targetKey];
    if (
      (typeof value !== 'string' && typeof value !== 'number') ||
      value === '' ||
      (typeof value === 'number' && !Number.isFinite(value))
    ) {
      return undefined;
    }
    values.push(value);
  }
  return Array.isArray(records) ? values : values[0];
}
