/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function cloneFormValues(values: unknown): Record<string, unknown> {
  if (!isRecord(values)) {
    return {};
  }

  const cloned: unknown = JSON.parse(JSON.stringify(values));
  return isRecord(cloned) ? cloned : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
