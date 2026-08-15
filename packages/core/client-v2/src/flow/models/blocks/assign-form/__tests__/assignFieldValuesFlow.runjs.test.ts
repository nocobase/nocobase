/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { resolveAssignFieldValues } from '../assignFieldValuesFlow';

describe('assignFieldValuesFlow RunJS values', () => {
  it('assigns successful RunJS results', async () => {
    const runjs = vi.fn(async () => ({ success: true, value: 42 }));
    const ctx = { message: undefined, runjs };

    await expect(
      resolveAssignFieldValues(ctx, {
        amount: {
          code: 'return 42;',
          version: 'v2',
        },
      }),
    ).resolves.toEqual({ amount: 42 });

    expect(runjs).toHaveBeenCalledWith('return 42;', undefined, { version: 'v2' });
  });

  it('shows an error and aborts assignment when RunJS fails', async () => {
    const message = { error: vi.fn() };
    const ctx = {
      message,
      runjs: async () => ({ success: false, error: new Error('boom') }),
      t: (messageText: string) => messageText,
    };

    await expect(
      resolveAssignFieldValues(
        ctx,
        {
          amountText: {
            code: 'throw new Error("boom")',
            version: 'v2',
          },
        },
        'UpdateRecordAction',
      ),
    ).resolves.toBeNull();

    expect(message.error).toHaveBeenCalledWith('RunJS execution failed');
  });

  it('skips assignment fields when RunJS returns undefined', async () => {
    const ctx = { message: undefined, runjs: async () => ({ success: true, value: undefined }) };

    await expect(
      resolveAssignFieldValues(ctx, {
        noReturn: {
          code: 'const value = 1;',
          version: 'v2',
        },
        returnUndefined: {
          code: 'return undefined;',
          version: 'v2',
        },
        preserved: 'ok',
      }),
    ).resolves.toEqual({
      preserved: 'ok',
    });
  });
});
