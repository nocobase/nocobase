/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { bindPopupSubTableBeforeClose } from '../popupSubTableBeforeClose';

const t = (value: string) => value;

const createDirtyModel = (uid: string, dirtyFields: string[] = []) => {
  const modifiedFields = new Set(dirtyFields);
  return {
    uid,
    subModels: {},
    getUserModifiedFields: () => modifiedFields,
    resetUserModifiedFields: vi.fn(() => modifiedFields.clear()),
  };
};

describe('bindPopupSubTableBeforeClose', () => {
  it('blocks close when the user cancels discarding unsaved row changes', async () => {
    const model = createDirtyModel('row-form', ['nickname']);
    const view = { beforeClose: undefined } as any;
    const modalConfirm = vi.fn().mockResolvedValue(false);

    const cleanup = bindPopupSubTableBeforeClose({
      view,
      model: model as any,
      modal: { confirm: modalConfirm },
      t,
    });

    await expect(view.beforeClose({ force: false })).resolves.toBe(false);
    expect(model.resetUserModifiedFields).not.toHaveBeenCalled();

    cleanup();
    expect(view.beforeClose).toBeUndefined();
  });

  it('keeps dirty state when downstream beforeClose still blocks closing', async () => {
    const model = createDirtyModel('row-form', ['nickname']);
    const previousBeforeClose = vi.fn().mockResolvedValue(false);
    const view = { beforeClose: previousBeforeClose } as any;
    const modalConfirm = vi.fn().mockResolvedValue(true);

    bindPopupSubTableBeforeClose({
      view,
      model: model as any,
      modal: { confirm: modalConfirm },
      t,
    });

    await expect(view.beforeClose({ force: false })).resolves.toBe(false);
    expect(previousBeforeClose).toHaveBeenCalledWith(
      expect.objectContaining({
        ignoredDirtyFormModelUids: ['row-form'],
      }),
    );
    expect(model.resetUserModifiedFields).not.toHaveBeenCalled();
  });

  it('removes a cleaned-up handler even when it is no longer on top of the chain', async () => {
    const staleModel = createDirtyModel('stale-row', ['nickname']);
    const activeModel = createDirtyModel('active-row', ['title']);
    const staleConfirm = vi.fn().mockResolvedValue(true);
    const activeConfirm = vi.fn().mockResolvedValue(true);
    const previousBeforeClose = vi.fn().mockResolvedValue(true);
    const view = { beforeClose: previousBeforeClose } as any;

    const cleanupStale = bindPopupSubTableBeforeClose({
      view,
      model: staleModel as any,
      modal: { confirm: staleConfirm },
      t,
    });

    bindPopupSubTableBeforeClose({
      view,
      model: activeModel as any,
      modal: { confirm: activeConfirm },
      t,
    });

    cleanupStale();

    await expect(view.beforeClose({ force: false })).resolves.toBe(true);
    expect(staleConfirm).not.toHaveBeenCalled();
    expect(activeConfirm).toHaveBeenCalledTimes(1);
    expect(previousBeforeClose).toHaveBeenCalledTimes(1);
    expect(staleModel.resetUserModifiedFields).not.toHaveBeenCalled();
    expect(activeModel.resetUserModifiedFields).toHaveBeenCalledTimes(1);
  });
});
