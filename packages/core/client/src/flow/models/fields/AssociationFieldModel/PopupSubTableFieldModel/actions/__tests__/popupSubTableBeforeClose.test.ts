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
      t: (value: string) => value,
    });

    await expect(view.beforeClose({ force: false })).resolves.toBe(false);
    expect(model.resetUserModifiedFields).not.toHaveBeenCalled();

    cleanup();
    expect(view.beforeClose).toBeUndefined();
  });

  it('clears dirty state after discard confirmation so the parent popup is not prompted again', async () => {
    const model = createDirtyModel('row-form', ['nickname']);
    const view = { beforeClose: undefined } as any;
    const modalConfirm = vi.fn().mockResolvedValue(true);

    bindPopupSubTableBeforeClose({
      view,
      model: model as any,
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
    });

    await expect(view.beforeClose({ force: false })).resolves.toBe(true);
    expect(model.resetUserModifiedFields).toHaveBeenCalledTimes(1);

    await expect(view.beforeClose({ force: false })).resolves.toBe(true);
    expect(modalConfirm).toHaveBeenCalledTimes(1);
  });
});
