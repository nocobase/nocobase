/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PageModel } from '@nocobase/client';

const getConfirmUnsavedChangesHandler = () => {
  const flow = PageModel.globalFlowRegistry.getFlow('beforeCloseGuard');
  const step = flow?.getStep('confirmUnsavedChanges');
  return step?.serialize().handler;
};

describe('PageModel beforeCloseGuard flow', () => {
  it('skips confirmation when there are no dirty forms', async () => {
    const handler = getConfirmUnsavedChangesHandler();
    const modalConfirm = vi.fn();

    expect(typeof handler).toBe('function');

    await handler?.({
      inputArgs: {
        dirty: {
          hasDirtyForms: false,
          formModelUids: [],
        },
      },
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
      exitAll: vi.fn(),
    });

    expect(modalConfirm).not.toHaveBeenCalled();
  });

  it('prevents close and exits remaining flows when confirmation is cancelled', async () => {
    const handler = getConfirmUnsavedChangesHandler();
    const prevent = vi.fn();
    const exitAll = vi.fn();
    const modalConfirm = vi.fn().mockResolvedValue(false);

    expect(typeof handler).toBe('function');

    await handler?.({
      inputArgs: {
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['form-1'],
        },
        controller: {
          prevent,
        },
      },
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
      exitAll,
    });

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unsaved changes',
        content: "Are you sure you don't want to save?",
      }),
    );
    expect(prevent).toHaveBeenCalledTimes(1);
    expect(exitAll).toHaveBeenCalledTimes(1);
  });
});
