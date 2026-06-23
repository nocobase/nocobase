/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { callAfterParamsSaveHook, callBeforeParamsSaveHook, replaceStepParams } from '../params-save-hooks';

describe('params save hooks', () => {
  it('calls legacy hooks with ctx while exposing structured args to destructured hooks', async () => {
    const ctx = { model: { uid: 'model-a' } } as any;
    const legacyBefore = vi.fn((legacyCtx, params) => {
      expect(legacyCtx.model.uid).toBe('model-a');
      expect(params).toEqual({ title: 'Draft' });
      return { title: 'Final' };
    });

    const beforeResult = await callBeforeParamsSaveHook(legacyBefore as any, {
      ctx,
      flowKey: 'settings',
      stepKey: 'configure',
      currentParams: { title: 'Draft' },
      previousParams: { title: 'Previous' },
    });

    expect(beforeResult).toEqual({ title: 'Final' });
    expect(legacyBefore).toHaveBeenCalledWith(ctx, { title: 'Draft' }, { title: 'Previous' });
    expect(ctx.ctx).toBeUndefined();

    const structuredAfter = vi.fn(({ ctx: structuredCtx, savedParams, previousParams }) => {
      expect(structuredCtx).toBe(ctx);
      expect(savedParams).toEqual({ title: 'Final' });
      expect(previousParams).toEqual({ title: 'Previous' });
    });

    await callAfterParamsSaveHook(structuredAfter as any, {
      ctx,
      flowKey: 'settings',
      stepKey: 'configure',
      savedParams: { title: 'Final' },
      previousParams: { title: 'Previous' },
    });

    expect(structuredAfter).toHaveBeenCalledTimes(1);
    expect(ctx.ctx).toBeUndefined();
  });

  it('replaces a step params object instead of using the merge-style step overload', () => {
    const setStepParams = vi.fn();
    const model = { setStepParams } as unknown as Parameters<typeof replaceStepParams>[0];

    replaceStepParams(model, 'settings', 'configure', { title: 'Final' });

    expect(setStepParams).toHaveBeenCalledWith('settings', { configure: { title: 'Final' } });
  });
});
