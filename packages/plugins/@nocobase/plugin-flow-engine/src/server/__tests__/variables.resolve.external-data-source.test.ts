/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as variableExpression from '../template/variable-expression';
import { resolveVariablesBatch, resolveVariablesTemplate } from '../variables/resolve';
import { resetVariablesRegistryForTest } from './test-utils';

describe('variables:resolve external data source records', () => {
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });

  it('resolves a popup record field when the repository returns plain JSON', async () => {
    const analyze = vi.spyOn(variableExpression, 'analyzeVariableTemplate');
    const findOne = vi.fn(async () => ({ id: 'lead-1', email: 'acme@example.test' }));
    const repository = { findOne };
    const collection = {
      filterTargetKey: 'id',
      model: {
        primaryKeyAttribute: 'id',
      },
    };
    const getDataSource = vi.fn((key: string) => {
      expect(key).toBe('crm_external');
      return {
        collectionManager: {
          db: {
            getCollection: () => collection,
            getRepository: () => repository,
          },
        },
      };
    });
    const koaContext = {
      app: {
        dataSourceManager: { get: getDataSource },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;

    const result = await resolveVariablesTemplate(
      koaContext,
      { value: '{{ ctx.popup.record.email }}' },
      {
        'popup.record': {
          dataSourceKey: 'crm_external',
          collection: 'leads',
          filterByTk: 'lead-1',
        },
      },
    );

    expect(result).toEqual({ value: 'acme@example.test' });
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      filterByTk: 'lead-1',
      fields: undefined,
      appends: undefined,
    });
    expect(analyze).toHaveBeenCalledTimes(1);
    analyze.mockRestore();
  });

  it('isolates public wrapper analysis failures and hides the lexical helper', async () => {
    const context = {
      app: {
        dataSourceManager: { get: vi.fn() },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const invalidTemplate = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new TypeError('untrusted template');
        },
      },
    );

    await expect(resolveVariablesTemplate(context, invalidTemplate)).resolves.toBe(invalidTemplate);
    await expect(
      resolveVariablesBatch(context, [
        { id: 'invalid', template: invalidTemplate },
        { id: 'valid', template: { value: 'unchanged' } },
      ]),
    ).resolves.toEqual([
      { id: 'invalid', data: invalidTemplate },
      { id: 'valid', data: { value: 'unchanged' } },
    ]);

    const helperAttempts = {
      directEval: '{{ eval("__resolveVariablePath0") }}',
      parenthesizedEval: '{{ (eval)("__resolveVariablePath0") }}',
      functionConstructor: '{{ Function("return __resolveVariablePath0")() }}',
      globalEval: '{{ globalThis.eval("__resolveVariablePath0") }}',
      indirectEval: '{{ (0, eval)("__resolveVariablePath0") }}',
    };
    await expect(resolveVariablesTemplate(context, helperAttempts, {})).resolves.toEqual(helperAttempts);
  });
});
