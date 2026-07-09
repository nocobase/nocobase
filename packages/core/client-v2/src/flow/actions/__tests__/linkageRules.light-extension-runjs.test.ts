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

import { RunJSSourceResolverRegistry } from '../../components/runjs-source';
import { linkageAssignField } from '../linkageRules';

describe('linkage RunJS light-extension values', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves field assignment RunJSValue through the light-extension resolver with settings', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: (input) => ({
        code: 'return `${ctx.settings.currency}:${ctx.formValues.amount}`',
        version: 'v2',
        settings: input.settings || {},
      }),
    });

    const fieldModel: any = { uid: 'amount-text-field', fieldPath: 'amountText' };
    const runjs = vi.fn(async function (this: any, code: string) {
      expect(this.settings).toEqual({ currency: 'USD' });
      return { success: true, value: `${this.settings.currency}:123.45:${code.includes('formValues')}` };
    });
    const ctx: any = new FlowContext();
    ctx.defineProperty('flowKey', { value: 'eventSettings' });
    ctx.defineProperty('currentStep', { value: { key: 'linkageRules' } });
    ctx.defineProperty('formValues', { value: { amount: 123.45 } });
    ctx.defineProperty('model', {
      value: {
        uid: 'form-block-runjs',
        use: 'FormBlockModel',
        subModels: { grid: { subModels: { items: [fieldModel] } } },
      },
    });
    ctx.defineProperty('engine', { value: { getModel: vi.fn(() => ({ fieldPath: 'amountText' })) } });
    ctx.defineProperty('app', { value: { jsonLogic: { apply: vi.fn() } } });
    ctx.defineMethod('runjs', runjs);
    const setProps = vi.fn();

    await linkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r1',
          enable: true,
          targetPath: 'amountText',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: {
            code: '',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_runjs',
              entryId: 'lee_normalize_amount',
              kind: 'runjs',
              publicationId: 'lep_normalize_amount',
              versionPolicy: 'pinned',
            },
            settings: { currency: 'USD' },
          },
        },
      ],
      setProps,
    });

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(setProps).toHaveBeenCalledWith(fieldModel, { value: 'USD:123.45:true' });
  });

  it('reports linkage RunJS runtime errors with index-based owner locator paths', async () => {
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

    const reportRuntimeError = vi.fn();
    const fieldModel: any = { uid: 'amount-text-field', fieldPath: 'amountText' };
    const ctx: any = new FlowContext();
    ctx.defineProperty('flowKey', { value: 'eventSettings' });
    ctx.defineProperty('currentStep', { value: { key: 'linkageRules' } });
    ctx.defineProperty('formValues', { value: { amount: 123.45 } });
    ctx.defineProperty('reportRuntimeError', { value: reportRuntimeError });
    ctx.defineProperty('model', {
      value: {
        uid: 'form-block-runjs',
        use: 'FormBlockModel',
        subModels: { grid: { subModels: { items: [fieldModel] } } },
      },
    });
    ctx.defineProperty('engine', { value: { getModel: vi.fn(() => ({ fieldPath: 'amountText' })) } });
    ctx.defineProperty('app', { value: { jsonLogic: { apply: vi.fn() } } });
    ctx.defineMethod('runjs', async () => ({ success: false, error: new Error('boom') }));
    ctx.__linkageRunJSOwnerPath = { ruleIndex: 0, actionIndex: 1 };
    const setProps = vi.fn();

    await linkageAssignField.handler(ctx, {
      value: [
        {
          key: 'rule-key',
          enable: true,
          targetPath: 'amountText',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: {
            code: '',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_runjs',
              entryId: 'lee_normalize_amount',
              kind: 'runjs',
              publicationId: 'lep_normalize_amount',
              versionPolicy: 'pinned',
            },
            settings: { currency: 'USD' },
          },
        },
      ],
      setProps,
    });

    expect(setProps).not.toHaveBeenCalled();
    expect(reportRuntimeError).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_runjs',
        entryId: 'lee_normalize_amount',
        publicationId: 'lep_normalize_amount',
        ownerKind: 'flowModel.runjsHost',
        path: 'src/client/runjs/normalize-amount/index.ts',
        ownerLocator: expect.objectContaining({
          modelUid: 'form-block-runjs',
          use: 'FormBlockModel',
          hostPath: [
            'stepParams',
            'eventSettings',
            'linkageRules',
            'value',
            '0',
            'actions',
            '1',
            'params',
            'value',
            '0',
            'value',
          ],
        }),
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
  });
});
