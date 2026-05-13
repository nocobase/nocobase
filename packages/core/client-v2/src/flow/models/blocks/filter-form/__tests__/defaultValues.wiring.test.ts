/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { filterFormDefaultValues } from '../../../../actions/filterFormDefaultValues';
import { FilterFormBlockModel } from '../FilterFormBlockModel';

describe('filter-form defaultValues wiring', () => {
  it('loads action and model modules', () => {
    expect(filterFormDefaultValues).toBeTruthy();
    expect(FilterFormBlockModel).toBeTruthy();
  });

  it('only excludes targets already handled by their own initial refresh', async () => {
    const refreshTargets = vi.fn().mockResolvedValue(undefined);
    const model = {
      initialRefreshHandledTargetIds: new Set<string>(),
      form: {},
      context: {
        refreshTargets,
      },
      prepareInitialFilterValues: vi.fn().mockResolvedValue(true),
    };

    FilterFormBlockModel.prototype.markInitialTargetRefreshHandled.call(model as any, 'target-1');
    await (FilterFormBlockModel.prototype as any).applyDefaultsAndInitialFilter.call(model);

    expect(refreshTargets).toHaveBeenCalledWith({ excludeTargetIds: new Set(['target-1']) });
  });

  it('does not cache initial defaults when form is not ready', async () => {
    const model = {
      form: undefined,
      initialDefaultsPromise: undefined,
      ensureFilterItemsBeforeRender: vi.fn().mockResolvedValue(undefined),
      applyFormDefaultValues: vi.fn().mockResolvedValue(undefined),
    };

    const prepared = await FilterFormBlockModel.prototype.prepareInitialFilterValues.call(model as any);

    expect(prepared).toBe(false);
    expect(model.initialDefaultsPromise).toBeUndefined();
    expect(model.applyFormDefaultValues).not.toHaveBeenCalled();
  });
});
