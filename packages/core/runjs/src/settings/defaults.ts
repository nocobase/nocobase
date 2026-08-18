/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSSettingsValue } from './runtime-validation';

export type RunJSSettingsDefaultResult = {
  hasDefault: boolean;
  value: unknown;
};

export function extractRunJSSettingsDefault(schema: unknown): RunJSSettingsDefaultResult {
  if (!isRecord(schema)) {
    return { hasDefault: false, value: {} };
  }

  const normalizedValue = normalizeRunJSSettingsValue(schema, undefined);
  if (!Object.prototype.hasOwnProperty.call(schema, 'default') && typeof normalizedValue === 'undefined') {
    return { hasDefault: false, value: {} };
  }

  return { hasDefault: true, value: normalizedValue };
}

export function extractRunJSSettingsDefaults(schema: unknown): Record<string, unknown> {
  const result = extractRunJSSettingsDefault(schema);
  return isRecord(result.value) ? result.value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
