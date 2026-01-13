/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isRunJSValue, normalizeRunJSValue } from './runjsValue';
import { runjsWithSafeGlobals } from './safeGlobals';

/**
 * Resolve an object's values, executing any RunJSValue entries via ctx.runjs.
 *
 * - Skips `undefined` values
 * - Skips empty RunJS code (treated as not configured)
 * - Throws when a RunJS execution fails
 */
export async function resolveRunJSObjectValues(ctx: unknown, raw: unknown): Promise<Record<string, any>> {
  const out: Record<string, any> = {};

  if (!raw || typeof raw !== 'object') return out;
  if (Array.isArray(raw)) return out;

  for (const [key, value] of Object.entries(raw as Record<string, any>)) {
    if (typeof value === 'undefined') continue;

    if (isRunJSValue(value)) {
      const { code, version } = normalizeRunJSValue(value);
      if (!code.trim()) continue;
      const ret = await runjsWithSafeGlobals(ctx, code, { version });
      if (!ret?.success) {
        throw new Error(`RunJS execution failed for "${key}"`);
      }
      if (typeof ret.value !== 'undefined') {
        out[key] = ret.value;
      }
      continue;
    }

    out[key] = value;
  }

  return out;
}
