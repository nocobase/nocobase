/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LLM_SERVICE_MODEL_ID_DUPLICATE, LLM_SERVICE_MODEL_ID_REQUIRED } from '../../common/error-codes';
import { create, update } from '../resource/llmServices';

const createContext = (values: Record<string, unknown>) => {
  const params = { values };
  const ctx = {
    action: {
      params,
      mergeParams: (nextParams: { values?: Record<string, unknown> }) => {
        if (nextParams.values) {
          params.values = nextParams.values;
        }
      },
    },
    t: (message: string) => message,
    throw: (status: number, details: { code: string; message: string; data: { index: number } }) => {
      throw Object.assign(new Error(details.message), { status, ...details });
    },
  } as unknown as Context;

  return { ctx, params };
};

describe('llmServices create and update actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects duplicate custom model IDs after trimming', async () => {
    const { ctx } = createContext({
      enabledModels: {
        mode: 'custom',
        models: [
          { value: 'gpt-4o', label: '' },
          { value: ' gpt-4o ', label: '' },
        ],
      },
    });
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: LLM_SERVICE_MODEL_ID_DUPLICATE,
      message: 'Model ID already exists',
      data: { index: 1 },
    });
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it('rejects blank custom model IDs', async () => {
    const { ctx } = createContext({
      enabledModels: {
        mode: 'custom',
        models: [{ value: '   ', label: '' }],
      },
    });
    const actionUpdate = vi.spyOn(actions, 'update').mockResolvedValue(undefined);

    await expect(update(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: LLM_SERVICE_MODEL_ID_REQUIRED,
      message: 'Model ID is required',
      data: { index: 0 },
    });
    expect(actionUpdate).not.toHaveBeenCalled();
  });

  it('allows case variants and normalizes surrounding whitespace', async () => {
    const { ctx, params } = createContext({
      enabledModels: {
        mode: 'custom',
        models: [
          { value: ' gpt-4o ', label: ' GPT 4o ' },
          { value: 'GPT-4O', label: ' ' },
        ],
      },
    });
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await create(ctx, vi.fn() as Next);

    expect(params.values).toEqual({
      enabledModels: {
        mode: 'custom',
        models: [
          { value: 'gpt-4o', label: 'GPT 4o' },
          { value: 'GPT-4O', label: '' },
        ],
      },
    });
    expect(actionCreate).toHaveBeenCalledWith(ctx, expect.any(Function));
  });
});
