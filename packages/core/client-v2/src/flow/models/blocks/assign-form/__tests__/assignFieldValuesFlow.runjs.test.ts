/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowContext } from '@nocobase/flow-engine';

import { RunJSSourceResolverRegistry } from '../../../../components/runjs-source';
import { resolveAssignFieldValues } from '../assignFieldValuesFlow';

describe('assignFieldValuesFlow RunJS values', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves nested light-extension RunJS assignment values with settings', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: (input) => ({
        code: 'return `${ctx.settings.currency}:${ctx.record.id}`',
        version: 'v2',
        settings: input.settings || {},
      }),
    });

    const ctx: any = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'assign_action_1', use: 'CreateRecordActionModel' } });
    ctx.defineProperty('record', { value: { id: 7 } });
    const message = { error: vi.fn() };
    ctx.defineProperty('message', { value: message });
    ctx.defineMethod('runjs', async function (this: any, code: string) {
      return { success: true, value: `${this.settings.currency}:7:${code.includes('record.id')}` };
    });

    await expect(
      resolveAssignFieldValues(ctx, {
        amountText: {
          code: '',
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_runjs',
            entryId: 'lee_normalize_amount',
            kind: 'runjs',
          },
          settings: { currency: 'USD' },
        },
      }),
    ).resolves.toEqual({
      amountText: 'USD:7:true',
    });
    expect(message.error).not.toHaveBeenCalled();
  });

  it('shows an error and aborts assignment when RunJS fails', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: (input) => ({
        code: 'throw new Error("boom")',
        version: 'v2',
        sourceMap: { entryPath: 'src/client/runjs/normalize-amount/index.ts' },
        settings: input.settings || {},
        context: input.context,
      }),
    });

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
            code: '',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_runjs',
              entryId: 'lee_normalize_amount',
              kind: 'runjs',
            },
            settings: { currency: 'USD' },
          },
        },
        'UpdateRecordAction',
        { settingsFlowKey: 'assignSettings' },
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
