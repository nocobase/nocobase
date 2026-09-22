/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getQuickEditViewContainer, syncQuickEditPreventClose } from '../quickEditViewContainer';

describe('quickEditViewContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only resolves the view container of a QuickEditFormModel parent', () => {
    const viewContainer = { update: vi.fn() };
    expect(getQuickEditViewContainer({ parent: { use: 'QuickEditFormModel', viewContainer } })).toBe(viewContainer);
    expect(getQuickEditViewContainer({ parent: { use: 'EditFormModel', viewContainer } })).toBeUndefined();
    expect(getQuickEditViewContainer({ parent: null })).toBeUndefined();
    expect(getQuickEditViewContainer(undefined)).toBeUndefined();
  });

  it('locks the popover while the dropdown is open and releases it after the closing click', () => {
    const update = vi.fn();
    const model = { parent: { use: 'QuickEditFormModel', viewContainer: { update } } };

    syncQuickEditPreventClose(model, true);
    expect(update).toHaveBeenCalledWith({ preventClose: true });

    syncQuickEditPreventClose(model, false);
    expect(update).toHaveBeenCalledTimes(1);

    vi.runAllTimers();
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenLastCalledWith({ preventClose: false });
  });

  it('is a no-op outside of quick edit', () => {
    const update = vi.fn();
    syncQuickEditPreventClose({ parent: { use: 'EditFormModel', viewContainer: { update } } }, true);
    syncQuickEditPreventClose({ parent: { use: 'QuickEditFormModel' } }, true);
    vi.runAllTimers();
    expect(update).not.toHaveBeenCalled();
  });
});
