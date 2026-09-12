/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Match v1 `Input.JSON` display semantics for workflow result viewers.
 *
 * - `null`/`undefined` → empty string
 * - string that itself is valid JSON text (`1234`, `true`, `{"a":1}`) → show raw string
 * - other strings (`hello`) → show JSON-quoted string
 * - non-strings → pretty JSON
 */
export function formatResultForDisplay(value: unknown, space = 2): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value, null, space);
    }
  }

  return JSON.stringify(value, null, space);
}
