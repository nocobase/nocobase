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

import { RunJSSourceResolverRegistry } from '../../components/runjs-source';
import { customVariable } from '../customVariable';

describe('customVariable RunJS values', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    vi.restoreAllMocks();
  });

  it('resolves light-extension sources and exposes the evaluated value', async () => {
    const resolve = vi.fn((input) => ({
      code: 'return ctx.settings.currency;',
      version: 'v2',
      settings: input.settings || {},
      context: input.context,
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    const ctx = new FlowContext();
    ctx.defineProperty('flowKey', { value: 'eventSettings' });
    ctx.defineProperty('currentStep', { value: { key: 'customVariable' } });
    ctx.defineProperty('model', { value: { uid: 'form_block_1', use: 'FormBlockModel', context: ctx } });
    ctx.defineMethod('runjs', async function (this: { settings?: Record<string, unknown> }, code: string) {
      return { success: true, value: `${this.settings?.currency}:${code.includes('ctx.settings')}` };
    });

    await customVariable.handler(ctx, {
      variables: [
        {
          key: 'total',
          title: 'Total',
          type: 'runjs',
          runjs: {
            code: '',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'repo_finance',
              entryId: 'entry_total',
              kind: 'runjs',
            },
            settings: { currency: 'USD' },
          },
        },
      ],
    });

    await expect((ctx as unknown as { total: Promise<unknown> }).total).resolves.toBe('USD:true');
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: expect.objectContaining({ entryId: 'entry_total' }),
        context: {
          ownerKind: 'flowModel.runjsHost',
          ownerLocator: expect.objectContaining({
            modelUid: 'form_block_1',
            use: 'FormBlockModel',
            hostPath: ['stepParams', 'eventSettings', 'customVariable', 'variables', '0', 'runjs'],
          }),
        },
      }),
    );
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
