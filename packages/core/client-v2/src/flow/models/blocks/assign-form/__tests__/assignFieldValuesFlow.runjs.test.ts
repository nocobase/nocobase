/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '@nocobase/flow-engine';

import { resolveAssignFieldValues } from '../assignFieldValuesFlow';

describe('assignFieldValuesFlow RunJS values', () => {
  it('shows an error and aborts assignment when RunJS fails', async () => {
    const ctx: any = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'assign_action_1', use: 'UpdateRecordActionModel' } });
    ctx.defineMethod('runjs', async () => ({ success: false, error: new Error('boom') }));
    const message = { error: vi.fn() };
    ctx.defineProperty('message', { value: message });
    ctx.defineProperty('t', { value: (messageText: string) => messageText });

    await expect(
      resolveAssignFieldValues(
        ctx,
        {
          amountText: {
            code: 'throw new Error("boom")',
            version: 'v2',
            settings: { currency: 'USD' },
          },
        },
        'UpdateRecordAction',
      ),
    ).resolves.toBeNull();

    expect(message.error).toHaveBeenCalledWith('RunJS execution failed');
  });

  it('skips assignment fields when RunJS returns undefined', async () => {
    const ctx: any = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'assign_action_1', use: 'UpdateRecordActionModel' } });
    ctx.defineMethod('runjs', async function (_code: string) {
      return { success: true, value: undefined };
    });

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

  it('preserves nested JSON constants that look like RunJSValue objects', async () => {
    const ctx: any = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'assign_action_1', use: 'UpdateRecordActionModel' } });
    const runjs = vi.fn();
    ctx.defineMethod('runjs', runjs);

    await expect(
      resolveAssignFieldValues(ctx, {
        metadata: {
          nested: { code: 'literal' },
          list: [{ code: 'item-literal' }],
        },
      }),
    ).resolves.toEqual({
      metadata: {
        nested: { code: 'literal' },
        list: [{ code: 'item-literal' }],
      },
    });
    expect(runjs).not.toHaveBeenCalled();
  });
});
