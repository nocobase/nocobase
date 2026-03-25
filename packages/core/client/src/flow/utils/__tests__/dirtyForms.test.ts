/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  collectDirtyFormModelUids,
  createBeforeCloseDirtyState,
  createDirtyConfirmBeforeCloseHandler,
  resetDirtyFormModels,
} from '../dirtyForms';

const createDirtyModel = (uid: string, dirtyFields: string[] = [], subModels: Record<string, any> = {}) => {
  const modifiedFields = new Set(dirtyFields);
  return {
    uid,
    subModels,
    getUserModifiedFields: () => modifiedFields,
    resetUserModifiedFields: vi.fn(() => modifiedFields.clear()),
  };
};

describe('dirtyForms utilities', () => {
  it('collects dirty form uids only from the current model tree', () => {
    const dirtyChild = createDirtyModel('dirty-child', ['title']);
    const cleanChild = createDirtyModel('clean-child');
    const dirtyGrandchild = createDirtyModel('dirty-grandchild', ['roles']);
    const root = createDirtyModel('root', [], {
      items: [dirtyChild, cleanChild],
      nested: {
        uid: 'nested',
        subModels: {
          forms: [dirtyGrandchild],
        },
      },
    });

    expect(collectDirtyFormModelUids(root as any)).toEqual(['dirty-child', 'dirty-grandchild']);
    expect(createBeforeCloseDirtyState(root as any)).toEqual({
      hasDirtyForms: true,
      formModelUids: ['dirty-child', 'dirty-grandchild'],
    });
  });

  it('resets only the targeted dirty forms', () => {
    const dirtyChild = createDirtyModel('dirty-child', ['title']);
    const anotherDirtyChild = createDirtyModel('dirty-child-2', ['roles']);
    const root = createDirtyModel('root', [], {
      items: [dirtyChild, anotherDirtyChild],
    });

    resetDirtyFormModels(root as any, ['dirty-child']);

    expect(dirtyChild.resetUserModifiedFields).toHaveBeenCalledTimes(1);
    expect(anotherDirtyChild.resetUserModifiedFields).not.toHaveBeenCalled();
    expect(collectDirtyFormModelUids(root as any)).toEqual(['dirty-child-2']);
  });

  it('confirms and clears dirty state for direct popup beforeClose handlers', async () => {
    const dirtyChild = createDirtyModel('dirty-child', ['title']);
    const modalConfirm = vi.fn().mockResolvedValue(true);
    const handler = createDirtyConfirmBeforeCloseHandler({
      model: dirtyChild as any,
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
    });

    await expect(handler({ force: false })).resolves.toBe(true);
    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unsaved changes',
        content: "Are you sure you don't want to save?",
      }),
    );
    expect(dirtyChild.resetUserModifiedFields).toHaveBeenCalledTimes(1);

    await expect(handler({ force: false })).resolves.toBe(true);
    expect(modalConfirm).toHaveBeenCalledTimes(1);
  });
});
