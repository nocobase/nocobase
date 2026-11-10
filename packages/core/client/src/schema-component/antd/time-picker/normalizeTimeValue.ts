/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Legacy Now defaults supply a local datetime while TimePicker expects a wall-clock time.
export function normalizeTimeValue(value: string) {
  return typeof value === 'string' ? value.replace(/^\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2})$/, '$1') : value;
}
