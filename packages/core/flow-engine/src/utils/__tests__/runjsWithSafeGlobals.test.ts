/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { runjsWithSafeGlobals } from '../..';

describe('runjsWithSafeGlobals', () => {
  it('forwards code, globals, and options to ctx.runjs with the context binding', async () => {
    let receiver: unknown;
    const runjs = vi.fn(async function (this: unknown) {
      receiver = this;
      return { success: true, value: 'ok' };
    });
    const ctx = { runjs };
    const options = { version: 'v2', timeoutMs: 100 };
    const extraGlobals = { customValue: 42 };

    await expect(runjsWithSafeGlobals(ctx, 'return customValue', options, extraGlobals)).resolves.toEqual({
      success: true,
      value: 'ok',
    });

    expect(receiver).toBe(ctx);
    expect(runjs).toHaveBeenCalledWith('return customValue', extraGlobals, options);
  });

  it('returns undefined when ctx.runjs is unavailable', async () => {
    await expect(runjsWithSafeGlobals(undefined, 'return 1')).resolves.toBeUndefined();
    await expect(runjsWithSafeGlobals({}, 'return 1')).resolves.toBeUndefined();
  });
});
