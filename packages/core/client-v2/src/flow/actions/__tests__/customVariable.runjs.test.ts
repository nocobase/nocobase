/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { customVariable } from '../customVariable';
import { RunJSSourceResolverRegistry } from '../../components/runjs-source';

describe('customVariable RunJS values', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('executes regular inline RunJS values', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('flowKey', { value: 'eventSettings' });
    ctx.defineProperty('currentStep', { value: { key: 'customVariable' } });
    ctx.defineProperty('model', { value: { uid: 'form_block_1', use: 'FormBlockModel', context: ctx } });
    const runjs = vi.fn(async (code: string) => ({
      success: true,
      value: code.includes('ctx.formValues.amount') ? 42 : undefined,
    }));
    ctx.defineMethod('runjs', runjs);

    await customVariable.handler(ctx, {
      variables: [
        {
          key: 'total',
          title: 'Total',
          type: 'runjs',
          runjs: { code: 'return ctx.formValues.amount;', version: 'v2' },
        },
      ],
    });

    await expect((ctx as unknown as { total: Promise<unknown> }).total).resolves.toBe(42);
    expect(runjs).toHaveBeenCalledWith('return ctx.formValues.amount;', undefined, { version: 'v2' });
  });

  it('treats stale light-extension metadata as ordinary inline RunJS', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('model', { value: { context: ctx } });
    const resolve = vi.fn(async () => ({ code: 'return 99;', version: 'v2' }));
    RunJSSourceResolverRegistry.registerResolver({ sourceMode: 'light-extension', resolve });
    const runjs = vi.fn(async function (this: FlowContext & { settings?: { offset?: number } }) {
      return { success: true, value: 9 + (this.settings?.offset || 0) };
    });
    ctx.defineMethod('runjs', runjs);

    await customVariable.handler(ctx, {
      variables: [
        {
          key: 'total',
          title: 'Total',
          type: 'runjs',
          runjs: {
            code: 'return 9;',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'legacy_repo',
              entryId: 'legacy_entry',
              kind: 'runjs',
            },
            settings: { offset: 1 },
          },
        },
      ],
    });

    await expect((ctx as unknown as { total: Promise<unknown> }).total).resolves.toBe(10);
    expect(runjs).toHaveBeenCalledWith('return 9;', undefined, { version: 'v2' });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('treats empty RunJS code as unconfigured', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('model', { value: { context: ctx } });
    const runjs = vi.fn();
    ctx.defineMethod('runjs', runjs);

    await customVariable.handler(ctx, {
      variables: [{ key: 'total', title: 'Total', type: 'runjs', runjs: { code: '', version: 'v2' } }],
    });

    await expect((ctx as unknown as { total: Promise<unknown> }).total).resolves.toBeUndefined();
    expect(runjs).not.toHaveBeenCalled();
  });

  it('ignores unsafe variable identifiers', async () => {
    const ctx = new FlowContext();
    const defineProperty = vi.fn();
    ctx.defineProperty('model', {
      value: {
        uid: 'form_block_1',
        use: 'FormBlockModel',
        context: { defineProperty },
      },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await customVariable.handler(ctx, {
      variables: [
        {
          key: '__proto__',
          title: 'Unsafe',
          type: 'runjs',
          runjs: { code: 'return 1;', version: 'v2' },
        },
      ],
    });

    expect(defineProperty).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[customVariable] Ignored an unsafe variable identifier');
  });
});
