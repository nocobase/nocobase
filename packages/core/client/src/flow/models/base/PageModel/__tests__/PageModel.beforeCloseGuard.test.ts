/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { confirmUnsavedChangesHandler } from '../closeGuard';

describe('PageModel closeGuard flow', () => {
  it('skips confirmation when there are no dirty forms', async () => {
    const modalConfirm = vi.fn();

    await confirmUnsavedChangesHandler({
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
    const prevent = vi.fn();
    const exitAll = vi.fn();
    const modalConfirm = vi.fn().mockResolvedValue(false);

    await confirmUnsavedChangesHandler({
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
